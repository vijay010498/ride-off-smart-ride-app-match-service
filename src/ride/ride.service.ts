import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DriverService } from '../driver/driver.service';
import { NewRiderRequest, RiderService } from '../rider/rider.service';
import { UserDocument } from '../common/schemas/user.schema';
import { RideRequestsFilterDto } from './dtos/ride-requests.filter.dto';
import mongoose from 'mongoose';

@Injectable()
export class RideService {
  private readonly logger = new Logger(RideService.name);
  constructor(
    private readonly driverService: DriverService,
    private readonly riderService: RiderService,
  ) {}

  async getRequests(user: UserDocument, filters: RideRequestsFilterDto) {
    let requestsAsDriver = [],
      requestsAsRider = [];

    if (!filters.requestType || filters.requestType === 'driver') {
      requestsAsDriver = await this.driverService.getDriverRequests(user);
    }

    if (!filters.requestType || filters.requestType === 'rider') {
      requestsAsRider = await this.riderService.getRiderRequests(user);
    }

    return {
      requestsAsDriver,
      requestsAsRider: requestsAsRider,
    };
  }

  async driverGivesPrice(
    requestId: string | mongoose.Types.ObjectId,
    driverStartingPrice: number,
  ) {
    // Validation happens in CanDriverGiveStartingPriceGuard

    // create new Rider Ride request and change this driver request status
    const updatedDriverRideRequest = await this.driverService.driverGivesPrice(
      requestId,
      driverStartingPrice,
    );

    const riderRide = await this.riderService.getRideById(
      updatedDriverRideRequest.riderRideId,
    );

    const newRiderRideRequest: NewRiderRequest = {
      riderId: riderRide.userId,
      riderRideId: updatedDriverRideRequest.riderRideId,
      driverRideId: updatedDriverRideRequest.driverRideId,
      driverRideRequestId: updatedDriverRideRequest.id,
      priceByDriver: updatedDriverRideRequest.driverStartingPrice,
    };

    await this.riderService.newRiderRequest(newRiderRideRequest);
    return updatedDriverRideRequest;
  }

  async driverDeclineRide(requestId: string | mongoose.Types.ObjectId) {
    try {
      // Validation happens in CanDriverDeclineRequestGuard
      // just change status and return the ride
      // TODO add this driver Ride in excluded cache (with TTL) for this request (Rider Ride ID - so this does not match again for this ride)
      return this.driverService.declineRequest(requestId);
    } catch (error) {
      this.logger.log('declineRide-error', error);
      throw new InternalServerErrorException();
    }
  }

  async driverAcceptRide(
    requestId: string | mongoose.Types.ObjectId,
    user: UserDocument,
  ) {
    try {
      // Validation happens in CanDriverAcceptRequestGuard

      const driverRequest = await this.driverService.getRequest(
        requestId,
        user.id,
      );

      return this.driverService.acceptRequest(
        requestId,
        driverRequest.riderRequestingPrice, // Driver can accept only when user negotiates
      );
    } catch (error) {
      this.logger.log('driverAcceptRide-error', error);
      throw new InternalServerErrorException();
    }
  }
}
