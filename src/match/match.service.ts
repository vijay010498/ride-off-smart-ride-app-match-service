import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  RiderRideDocument,
  RiderRideStatus,
} from '../common/schemas/rider-ride.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DriverRideDocument,
  DriverRideStatus,
} from '../common/schemas/driver-ride.schema';
import { SqsService } from '../sqs/sqs.service';
import { DriverRideRequestsDocument } from '../common/schemas/driver-ride-requests.schema';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  constructor(
    @Inject(forwardRef(() => SqsService))
    private readonly sqsService: SqsService,
    @InjectModel('DriverRide')
    private readonly driverRideCollection: Model<DriverRideDocument>,
    @InjectModel('RiderRide')
    private readonly riderRideCollection: Model<RiderRideDocument>,
    @InjectModel('DriverRideRequests')
    private readonly driverRideRequestsCollection: Model<DriverRideRequestsDocument>,
  ) {}

  async matchRiderRide(riderRide: RiderRideDocument) {
    try {
      if (riderRide.status !== RiderRideStatus.created) {
        this.logger.warn('Processing a not created in status ride');
        return false;
      }
      console.log('finding-matching rides');
      const matchedDriverRides = await this.driverRideCollection.aggregate([
        {
          $match: {
            status: DriverRideStatus.created,
            availableSeats: {
              $gte: riderRide.seats,
            },
            $and: [
              {
                $or: [
                  {
                    $and: [
                      {
                        'origin.coordinates': {
                          $geoWithin: {
                            $centerSphere: [
                              [
                                riderRide.from.coordinates[0],
                                riderRide.from.coordinates[1],
                              ],
                              10 / 6371, // 10 km radius in radians
                            ],
                          },
                        },
                      },
                      {
                        leaving: {
                          $gte: new Date(
                            riderRide.departing.getTime() - 20 * 60000,
                          ),
                          $lte: new Date(
                            riderRide.departing.getTime() + 20 * 60000,
                          ),
                        },
                      },
                    ],
                  },
                  {
                    'stops.coordinates': {
                      $elemMatch: {
                        $and: [
                          {
                            coordinates: {
                              $geoWithin: {
                                $centerSphere: [
                                  [
                                    riderRide.from.coordinates[0],
                                    riderRide.from.coordinates[1],
                                  ],
                                  10 / 6371, // 10 km radius in radians
                                ],
                              },
                            },
                          },
                          {
                            arrivalTime: {
                              $gte: new Date(
                                riderRide.departing.getTime() - 20 * 60000,
                              ),
                              $lte: new Date(
                                riderRide.departing.getTime() + 20 * 60000,
                              ),
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              {
                $or: [
                  {
                    'destination.coordinates': {
                      $geoWithin: {
                        $centerSphere: [
                          [
                            riderRide.to.coordinates[0],
                            riderRide.to.coordinates[1],
                          ],
                          10 / 6371, // 10 km radius in radians
                        ],
                      },
                    },
                  },
                  {
                    'stops.coordinates': {
                      $elemMatch: {
                        coordinates: {
                          $geoWithin: {
                            $centerSphere: [
                              [
                                riderRide.to.coordinates[0],
                                riderRide.to.coordinates[1],
                              ],
                              10 / 6371, // 10 km radius in radians
                            ],
                          },
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 10,
        },
      ]);

      if (!matchedDriverRides || !matchedDriverRides.length) {
        this.logger.log(
          `No Drivers Found for this ride: ${riderRide._id}, putting back into SQS queue to process later`,
        );
        // If not even one matches found - push back into the processing queue to process later
        return this.sqsService.noDriversFoundEvent(riderRide);
      }

      this.logger.log('matchedDriverRides', matchedDriverRides);
      await Promise.all([
        this.processDriverRideRequests(matchedDriverRides, riderRide),
        this.riderRideCollection.findByIdAndUpdate(riderRide._id, {
          $set: {
            status: RiderRideStatus.searching,
          },
        }),
      ]);
      return true;
    } catch (error) {
      this.logger.error('matchRiderRide-error', error);
    }
  }

  private async processDriverRideRequests(
    matchedDriversRides: DriverRideDocument[],
    riderRide: RiderRideDocument,
  ) {
    const driverRideRequestsPromises = matchedDriversRides.map(
      (matchedDriverRide) => {
        return new this.driverRideRequestsCollection({
          driverId: matchedDriverRide.userId,
          riderRideId: riderRide._id,
          canAccept: false, // first time driver should give price then wait for rider response
          rideRequestDetails: '',
        }).save();
      },
    );
    return Promise.all(driverRideRequestsPromises);
  }
}
