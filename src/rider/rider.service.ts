import { Injectable, Logger } from '@nestjs/common';
import { UserDocument } from '../common/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  RiderRideDocument,
  RiderRideStatus,
} from '../common/schemas/rider-ride.schema';
import {
  RiderRideRequestsDocument,
  RiderRideRequestsStatusEnums,
} from '../common/schemas/rider-ride-requests.schema';

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
    riderId: mongoose.Types.ObjectId | string,
  ) {
    return this.riderRideRequestsCollection.findOne({
      _id: requestId,
      riderId,
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

  private async invalidAllPendingRequests(
    acceptedRequestId: mongoose.Types.ObjectId | string,
    rider: UserDocument,
    riderRideId: mongoose.Types.ObjectId | string,
  ) {
    return this.riderRideRequestsCollection.updateMany(
      {
        _id: { $ne: acceptedRequestId },
        status: {
          // Only pending requests
          $in: [
            RiderRideRequestsStatusEnums.WAITING_FOR_DRIVER_RESPONSE,
            RiderRideRequestsStatusEnums.WAITING_FOR_DRIVER_RESPONSE,
          ],
        },
        riderId: rider._id,
        riderRideId,
      },
      {
        $set: {
          status: RiderRideRequestsStatusEnums.OTHER_REQUEST_ACCEPTED,
          canAccept: false,
          canDecline: false,
          canNegotiate: false,
        },
      },
    );
  }
  async acceptRequest(
    requestId: mongoose.Types.ObjectId | string,
    rider: UserDocument,
  ) {
    const request = await this.getRequest(requestId, rider.id);
    const acceptedPrice = request.negotiatedPrice
      ? request.negotiatedPrice
      : request.priceByDriver; // if negotiated by rider then driver accept the  rider, if not rider accept first go for the given price by driver
    const updatedRideRequest = await this.riderRideRequestsCollection
      .findByIdAndUpdate(
        requestId,
        {
          $set: {
            status: RiderRideRequestsStatusEnums.ACCEPTED_BY_RIDER,
            canAccept: false,
            canDecline: false,
            canNegotiate: false,
            acceptedPrice,
          },
        },
        {
          new: true,
        },
      )
      .populate(['riderRideId', 'driverRideId']);

    // update rider ride
    await this.riderRideCollection.findByIdAndUpdate(
      updatedRideRequest.riderRideId,
      {
        $set: {
          status: RiderRideStatus.booked,
          confirmedRiderRequestID: updatedRideRequest.id,
        },
      },
    );

    // Invalid other pending requests
    await this.invalidAllPendingRequests(
      requestId,
      rider,
      updatedRideRequest.riderRideId,
    );

    return updatedRideRequest;
  }
}
