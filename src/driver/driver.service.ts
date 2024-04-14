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
import { RideRequestsFilterDto } from '../ride/dtos/ride-requests.filter.dto';

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
  async getDriverRequests(
    driver: UserDocument,
    filters: RideRequestsFilterDto,
  ) {
    let query = this.driverRideRequestsCollection
      .find({ driverId: driver.id })
      .populate(['riderRideId', 'driverRideId'])
      .sort({ createdAt: 'descending' });

    if (filters.requestStatus) {
      query = query.where('status').equals(filters.requestStatus);
    }

    return query.exec();
  }

  async driverGivesPrice(
    requestId: mongoose.Types.ObjectId | string,
    startingPrice: number,
  ) {
    return this.driverRideRequestsCollection.findByIdAndUpdate(
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
    );
  }

  async declineRequest(requestId: mongoose.Types.ObjectId | string) {
    return this.driverRideRequestsCollection.findByIdAndUpdate(
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
    );
  }

  async acceptRequest(
    requestId: mongoose.Types.ObjectId | string,
    acceptedPrice: number,
    status: DriverRideRequestsStatusEnums = DriverRideRequestsStatusEnums.ACCEPTED_BY_DRIVER,
    riderRideRequestId: mongoose.Types.ObjectId | string,
  ) {
    const updatedRequest =
      await this.driverRideRequestsCollection.findByIdAndUpdate(
        requestId,
        {
          $set: {
            status: status,
            canDecline: false,
            canAccept: false,
            acceptedPrice,
            riderRideRequestId,
          },
        },
        {
          new: true,
        },
      );

    // Invalid any other pending requests
    await this.invalidAllDriverRequestForRiderRideId(
      updatedRequest.id,
      updatedRequest.riderRideId,
    );
    // Update Driver Ride Document
    const driverRide = await this.driverRideCollection.findById(
      updatedRequest.driverRideId,
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
    return updatedRequest;
  }

  async riderDeclinesRequest(
    driverRideRequestId: mongoose.Types.ObjectId | string,
    riderRideRequestId: mongoose.Types.ObjectId | string,
  ) {
    return this.driverRideRequestsCollection.findByIdAndUpdate(
      driverRideRequestId,
      {
        $set: {
          status: DriverRideRequestsStatusEnums.DECLINED_BY_RIDER,
          canAccept: false,
          canDecline: false,
          shouldGivePrice: false,
          riderRideRequestId,
        },
      },
      {
        new: true,
      },
    );
  }

  async riderNegotiatesPrice(
    driverRideRequestId: mongoose.Types.ObjectId | string,
    riderRideRequestId: mongoose.Types.ObjectId | string,
    negotiatedPrice: number,
  ) {
    return this.driverRideRequestsCollection.findByIdAndUpdate(
      driverRideRequestId,
      {
        $set: {
          riderRideRequestId,
          status: DriverRideRequestsStatusEnums.WAITING_FOR_DRIVER_RESPONSE,
          riderRequestingPrice: negotiatedPrice,
          canAccept: true,
          canDecline: true,
          shouldGivePrice: false,
        },
      },
      {
        new: true,
      },
    );
  }

  async riderAcceptedRequest(
    driverRideRequestId: mongoose.Types.ObjectId | string,
    riderRideRequestId: mongoose.Types.ObjectId | string,
  ) {
    // update driver request also driver ride
    const driverRideRequest = await this.getRequestById(driverRideRequestId);

    const acceptedPrice =
      driverRideRequest.riderRequestingPrice ||
      driverRideRequest.driverStartingPrice;

    await this.acceptRequest(
      driverRideRequestId,
      acceptedPrice,
      DriverRideRequestsStatusEnums.ACCEPTED_BY_RIDER,
      riderRideRequestId,
    );

    // Invalid all the other driver requests
    await this.invalidAllDriverRequestForRiderRideId(
      driverRideRequestId,
      driverRideRequest.riderRideId,
    );
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
