import { Injectable, Logger } from '@nestjs/common';
import { UserDocument } from '../common/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RiderRideDocument } from '../common/schemas/rider-ride.schema';
import { RiderRideRequestsDocument } from '../common/schemas/rider-ride-requests.schema';

export type NewRiderRequest = {
  riderId: mongoose.Types.ObjectId | string;
  riderRideId: mongoose.Types.ObjectId | string;
  driverRideId: mongoose.Types.ObjectId | string;
  driverRideRequestId: mongoose.Types.ObjectId | string;
  priceByDriver: number;
};
@Injectable()
export class RiderService {
  private readonly logger = new Logger(RiderService.name);

  constructor(
    @InjectModel('RiderRide')
    private readonly riderRideCollection: Model<RiderRideDocument>,
    @InjectModel('RiderRideRequests')
    private readonly riderRideRequestsCollection: Model<RiderRideRequestsDocument>,
  ) {}

  async getRides(rider: UserDocument) {
    return this.riderRideCollection
      .find({
        userId: rider.id,
      })
      .exec();
  }

  async getRideById(rideId: mongoose.Types.ObjectId | string) {
    return this.riderRideCollection.findById(rideId);
  }

  async getRequest(
    requestId: mongoose.Types.ObjectId | string,
    riderRideRequestsCollection: mongoose.Types.ObjectId | string,
  ) {
    return this.riderRideRequestsCollection.findOne({
      _id: requestId,
      riderRideRequestsCollection,
    });
  }
  async getRiderRequests(rider: UserDocument) {
    return this.riderRideRequestsCollection
      .find({
        riderId: rider.id,
      })
      .populate(['riderRideId', 'driverRideId'])
      .sort({
        createdAt: 'descending',
      })
      .exec();
  }

  async newRiderRequest({
    riderRideId,
    riderId,
    driverRideId,
    driverRideRequestId,
    priceByDriver,
  }: NewRiderRequest) {
    return new this.riderRideRequestsCollection({
      riderRideId,
      riderId,
      driverRideId,
      driverRideRequestId,
      priceByDriver,
    }).save();
  }
}
