import { Injectable, Logger } from '@nestjs/common';
import { RiderRideDocument } from '../common/schemas/rider-ride.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DriverRideDocument,
  DriverRideStatus,
} from '../common/schemas/driver-ride.schema';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  constructor(
    @InjectModel('DriverRide')
    private readonly driverRideCollection: Model<DriverRideDocument>,
    @InjectModel('RiderRide')
    private readonly riderRideCollection: Model<RiderRideDocument>,
  ) {}

  async matchRiderRide(riderRide: RiderRideDocument) {
    try {
      console.log('finding-matching rides');
      const resp = await this.driverRideCollection.aggregate([
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
      this.logger.log('Matching rides', resp);
    } catch (error) {
      this.logger.error('matchRiderRide-error', error);
    }
  }
}
