import { Injectable, Logger } from '@nestjs/common';
import { UserDocument } from '../common/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  DriverRideDocument,
  DriverRideStatus,
} from '../common/schemas/driver-ride.schema';
import {
  DriverRideRequestsDocument,
  DriverRideRequestsStatusEnums,
} from '../common/schemas/driver-ride-requests.schema';

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);
  constructor(
    @InjectModel('DriverRide')
    private readonly driverRideCollection: Model<DriverRideDocument>,
    @InjectModel('DriverRideRequests')
    private readonly driverRideRequestsCollection: Model<DriverRideRequestsDocument>,
  ) {}
  async getRides(user: UserDocument) {
    return this.driverRideCollection
      .find({
        userId: user.id,
      })
      .populate('vehicleId')
      .sort({
        createdAt: 'descending',
      })
      .exec();
  }

  async getRequest(
    requestId: mongoose.Types.ObjectId | string,
    driverId: mongoose.Types.ObjectId | string,
  ) {
    return this.driverRideRequestsCollection.findOne({
      _id: requestId,
      driverId,
    });
  }

  private async getRequestById(requestId: mongoose.Types.ObjectId | string) {
    return this.driverRideRequestsCollection.findOne({
      _id: requestId,
    });
  }
  async getDriverRequests(user: UserDocument) {
    return this.driverRideRequestsCollection
      .find({
        driverId: user.id,
      })
      .populate(['riderRideId', 'driverRideId', 'riderRideRequestId'])
      .sort({
        createdAt: 'descending',
      })
      .exec();
  }

  async driverGivesPrice(
    requestId: mongoose.Types.ObjectId | string,
    startingPrice: number,
  ) {
    return this.driverRideRequestsCollection
      .findByIdAndUpdate(
        requestId,
        {
          $set: {
            driverStartingPrice: startingPrice,
            status: DriverRideRequestsStatusEnums.WAITING_FOR_RIDER_RESPONSE,
            shouldGivePrice: false,
            canDecline: false, // Driver cannot decline once price is given
          },
        },
        {
          new: true,
        },
      )
      .populate(['riderRideId', 'driverRideId', 'riderRideRequestId']);
  }

  async declineRequest(requestId: mongoose.Types.ObjectId | string) {
    return this.driverRideRequestsCollection
      .findByIdAndUpdate(
        requestId,
        {
          $set: {
            status: DriverRideRequestsStatusEnums.DECLINED_BY_DRIVER,
            canDecline: false,
            canAccept: false,
            shouldGivePrice: false,
          },
        },
        {
          new: true,
        },
      )
      .populate(['riderRideId', 'driverRideId', 'riderRideRequestId']);
  }

  async acceptRequest(
    requestId: mongoose.Types.ObjectId | string,
    acceptedPrice: number,
    status: DriverRideRequestsStatusEnums = DriverRideRequestsStatusEnums.ACCEPTED_BY_DRIVER,
  ) {
    return this.driverRideRequestsCollection
      .findByIdAndUpdate(
        requestId,
        {
          $set: {
            status: status,
            canDecline: false,
            canAccept: false,
            acceptedPrice,
          },
        },
        {
          new: true,
        },
      )
      .populate(['riderRideId', 'driverRideId', 'riderRideRequestId']);
  }

  async riderAcceptedRide(
    driverRideRequestId: mongoose.Types.ObjectId | string,
  ) {
    // update driver request also driver ride
    const driverRideRequest = await this.getRequestById(driverRideRequestId);

    const acceptedPrice =
      driverRideRequest.riderRequestingPrice ||
      driverRideRequest.driverStartingPrice;

    const acceptedDriverRequest = await this.acceptRequest(
      driverRideRequestId,
      acceptedPrice,
      DriverRideRequestsStatusEnums.ACCEPTED_BY_RIDER,
    );

    // Invalid all the other driver requests
    await this.invalidAllDriverRequestForRiderRideId(
      acceptedDriverRequest.id,
      driverRideRequest.riderRideId,
    );

    // Update Driver Ride Document
    const driverRide = await this.driverRideCollection.findById(
      acceptedDriverRequest.driverRideId,
    );
    await this.driverRideCollection.findByIdAndUpdate(driverRide.id, {
      $set: {
        availableSeats: driverRide.availableSeats - 1,
        status:
          driverRide.availableSeats - 1 <= 0
            ? DriverRideStatus.full
            : DriverRideStatus.created,
      },
    });
  }

  private async invalidAllDriverRequestForRiderRideId(
    acceptedDriverRequestId: mongoose.Types.ObjectId | string,
    riderRideId: mongoose.Types.ObjectId | string,
  ) {
    return this.driverRideRequestsCollection.updateMany(
      {
        _id: { $ne: acceptedDriverRequestId },
        status: {
          $in: [
            DriverRideRequestsStatusEnums.WAITING_FOR_DRIVER_RESPONSE,
            DriverRideRequestsStatusEnums.WAITING_FOR_RIDER_RESPONSE,
          ],
        },
        riderRideId,
      },
      {
        status: DriverRideRequestsStatusEnums.OTHER_DRIVER_ACCEPTED,
        canDecline: false,
        canAccept: false,
        shouldGivePrice: false,
      },
    );
  }
}
