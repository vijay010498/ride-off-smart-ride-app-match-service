import { Injectable, Logger } from '@nestjs/common';
import { DriverService } from '../driver/driver.service';
import { RiderService } from '../rider/rider.service';
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
      requestsAsRider = await this.driverService.getDriverRequests(user);
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

    // TODO should create new Rider Request

    return updatedDriverRideRequest;
  }
}
