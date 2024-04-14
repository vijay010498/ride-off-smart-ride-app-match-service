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
import { DriverRideRequestsStatusEnums } from '../common/schemas/driver-ride-requests.schema';
import { RidesFiltersDto } from './dtos/rides-filters.dto';

@Injectable()
export class RideService {
  private readonly logger = new Logger(RideService.name);
  constructor(
    private readonly driverService: DriverService,
    private readonly riderService: RiderService,
  ) {}

  async getRides(user: UserDocument, filters: RidesFiltersDto) {
    let ridesAsDriver = [],
      ridesAsRider = [];

    if (!filters.requestType || filters.requestType === 'driver') {
      ridesAsDriver = await this.driverService.getRides(user);
    }

    if (!filters.requestType || filters.requestType === 'rider') {
      ridesAsRider = await this.riderService.getRides(user);
    }

    return {
      ridesAsDriver: ridesAsDriver,
      ridesAsRider: ridesAsRider,
    };
  }
  async getRequests(user: UserDocument, filters: RideRequestsFilterDto) {
    let requestsAsDriver = [],
      requestsAsRider = [];

    if (!filters.requestType || filters.requestType === 'driver') {
      requestsAsDriver = await this.driverService.getDriverRequests(
        user,
        filters,
      );
    }

    if (!filters.requestType || filters.requestType === 'rider') {
      requestsAsRider = await this.riderService.getRiderRequests(user, filters);
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
    return updatedDriverRideRequest.populate(['riderRideId', 'driverRideId']);
  }

  async driverDeclineRide(requestId: string | mongoose.Types.ObjectId) {
    try {
      // Validation happens in CanDriverDeclineRequestGuard
      // just change status and return the ride
      // TODO add this driver Ride in excluded cache (with TTL) for this request (Rider Ride ID - so this does not match again for this ride)
      const updatedDriverRideRequest =
        await this.driverService.declineRequest(requestId);

      if (updatedDriverRideRequest.riderRideRequestId) {
        // when driver declines after rider negotiates
        await this.riderService.driverDeclinesRequest(
          updatedDriverRideRequest.riderRideRequestId,
        );
      }

      return updatedDriverRideRequest.populate(['riderRideId', 'driverRideId']);
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

      const updatedDriverRideRequest = await this.driverService.acceptRequest(
        requestId,
        driverRequest.riderRequestingPrice, // Driver can accept only when user negotiates
        DriverRideRequestsStatusEnums.ACCEPTED_BY_DRIVER,
        driverRequest.riderRideRequestId,
      );

      // Update Rider Ride as well
      await this.riderService.driverAcceptRequest(
        updatedDriverRideRequest.riderRideRequestId,
        user,
      );

      return updatedDriverRideRequest.populate(['riderRideId', 'driverRideId']);
    } catch (error) {
      this.logger.log('driverAcceptRide-error', error);
      throw new InternalServerErrorException();
    }
  }

  async riderAcceptRide(
    requestId: string | mongoose.Types.ObjectId,
    rider: UserDocument,
  ) {
    try {
      // Accept the rider ride request , invalid any other request for this riderId, update Rider Ride to booked as well
      const updatedRiderRequest = await this.riderService.acceptRequest(
        requestId,
        rider,
      );
      // update driverRequest , make changes for rides as well
      await this.driverService.riderAcceptedRequest(
        updatedRiderRequest.driverRideRequestId,
        requestId,
      );

      return updatedRiderRequest.populate(['riderRideId', 'driverRideId']);
    } catch (error) {
      this.logger.log('riderAcceptRide-error', error);
      throw new InternalServerErrorException();
    }
  }

  async riderDeclinesRequest(requestId: string | mongoose.Types.ObjectId) {
    try {
      // declined Rider Ride Request
      const updatedRiderRequest =
        await this.riderService.declinesRequest(requestId);

      // update driver ride request as well
      await this.driverService.riderDeclinesRequest(
        updatedRiderRequest.driverRideRequestId,
        requestId,
      );

      return updatedRiderRequest.populate(['riderRideId', 'driverRideId']);
    } catch (error) {
      this.logger.log('riderDeclinesRequest-error', error);
      throw new InternalServerErrorException();
    }
  }

  async riderNegotiatesPrice(
    requestId: string | mongoose.Types.ObjectId,
    price: number,
  ) {
    try {
      // Update Rider Sice
      const updatedRiderRideRequest = await this.riderService.negotiate(
        requestId,
        price,
      );

      // Update Driver Side
      await this.driverService.riderNegotiatesPrice(
        updatedRiderRideRequest.driverRideRequestId,
        updatedRiderRideRequest._id,
        updatedRiderRideRequest.negotiatedPrice,
      );

      return updatedRiderRideRequest.populate(['riderRideId', 'driverRideId']);
    } catch (error) {
      this.logger.log('riderNegotiatesPrice-error', error);
      throw new InternalServerErrorException();
    }
  }
}
