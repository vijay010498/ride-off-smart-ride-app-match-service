import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserInterceptor } from '../common/interceptors/current-user.interceptor';
import { AccessTokenGuard } from '../common/guards/accessToken.guard';
import { IsBlockedGuard } from '../common/guards/isBlocked.guard';
import { IsSignedUpGuard } from '../common/guards/isSignedUp.guard';
import { TokenBlacklistGuard } from '../common/guards/tokenBlacklist.guard';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../common/schemas/user.schema';
import { RideRequestsFilterDto } from './dtos/ride-requests.filter.dto';
import { RideService } from './ride.service';
import { RideRequestsDto } from './dtos/ride-requests.dto';
import { DriverRideRequestDto } from './dtos/driver-ride-request.dto';
import { RequestIdParamDto } from './dtos/request-Id-param.dto';
import { GivePriceDto } from './dtos/give-price.dto';
import { CanDriverDeclineRequestGuard } from '../common/guards/can-driver-decline-request.guard';
import { CanDriverAcceptRequestGuard } from '../common/guards/can-driver-accept-request.guard';
import { CanDriverGiveStartingPriceGuard } from '../common/guards/can-driver-give-starting-price.guard';
import { CanRiderAcceptRequestGuard } from '../common/guards/can-rider-accept-request.guard';
import { RiderRideRequestDto } from './dtos/rider-ride-request.dto';
import { CanRiderDeclineRequestGuard } from '../common/guards/can-rider-decline-request.guard';
import { CanRiderNegotiateRequestGuard } from '../common/guards/can-rider-negotiate-request.guard';
import { RidesDto } from './dtos/rides.dto';
import { RidesFiltersDto } from './dtos/rides-filters.dto';
import { RiderRideRequestsStatusEnums } from '../common/schemas/rider-ride-requests.schema';
import { DriverRideRequestsStatusEnums } from '../common/schemas/driver-ride-requests.schema';

@ApiBearerAuth()
@ApiTags('RIDES')
@ApiForbiddenResponse({
  description: 'User is blocked',
})
@ApiUnauthorizedResponse({
  description: 'Invalid Token',
})
@ApiBadRequestResponse({
  description: 'User Does not exist / User Should be SignedUp to get Verified',
})
@Controller('ride')
@UseInterceptors(CurrentUserInterceptor)
@UseGuards(
  AccessTokenGuard,
  IsBlockedGuard,
  IsSignedUpGuard,
  TokenBlacklistGuard,
)
export class RideController {
  constructor(private readonly rideService: RideService) {}
  @ApiOperation({
    summary: 'Get User Rides',
  })
  @ApiResponse({
    description: 'Get User Ride Requests',
    type: [RidesDto],
  })
  @ApiQuery({
    name: 'requestType',
    required: false,
    type: String,
    enum: ['driver', 'rider'],
  })
  @Get('/rides')
  @Serialize(RidesDto)
  getRides(
    @CurrentUser() user: UserDocument,
    @Query() filters: RidesFiltersDto,
  ) {
    return this.rideService.getRides(user, filters);
  }

  @ApiOperation({
    summary: 'Get User Ride Requests',
  })
  @ApiResponse({
    description: 'Get User Ride Requests',
    type: [RideRequestsDto],
  })
  @ApiQuery({
    name: 'requestType',
    required: false,
    type: String,
    enum: ['driver', 'rider'],
  })
  @ApiQuery({
    name: 'requestStatus',
    required: false,
    type: String,
    enum: [
      ...Object.values(RiderRideRequestsStatusEnums),
      ...Object.values(DriverRideRequestsStatusEnums),
    ],
  })
  @Get('/requests')
  @Serialize(RideRequestsDto)
  getRequests(
    @CurrentUser() user: UserDocument,
    @Query() filters: RideRequestsFilterDto,
  ) {
    return this.rideService.getRequests(user, filters);
  }

  @ApiOperation({
    summary: 'Driver Gives Price for the request',
  })
  @ApiResponse({
    description: 'Price Accepted',
    type: DriverRideRequestDto,
  })
  @ApiBadRequestResponse({
    description: `Request not found`,
  })
  @ApiParam({
    name: 'requestId',
    description: 'Request id',
    type: String,
  })
  @Serialize(DriverRideRequestDto)
  @UseGuards(CanDriverGiveStartingPriceGuard)
  @Patch('/driver/givePrice/:requestId')
  givePrice(@Param() params: RequestIdParamDto, @Body() body: GivePriceDto) {
    // Validation happens in CanDriverGiveStartingPriceGuard
    return this.rideService.driverGivesPrice(params.requestId, body.price);
  }

  @ApiOperation({
    summary: 'Driver Decline The Ride',
  })
  @ApiResponse({
    description: 'Ride Declined',
    type: DriverRideRequestDto,
  })
  @ApiBadRequestResponse({
    description: `Request not found`,
  })
  @ApiParam({
    name: 'requestId',
    description: 'Request id',
    type: String,
  })
  @Serialize(DriverRideRequestDto)
  @UseGuards(CanDriverDeclineRequestGuard)
  @Patch('/driver/declineRequest/:requestId')
  driverDeclineRide(@Param() params: RequestIdParamDto) {
    // Validation happens in CanDriverDeclineRequestGuard
    return this.rideService.driverDeclineRide(params.requestId);
  }

  @ApiOperation({
    summary:
      'Driver Accepts The Ride - Only available when the rider negotiates',
  })
  @ApiResponse({
    description: 'Ride Accepted',
    type: DriverRideRequestDto,
  })
  @ApiBadRequestResponse({
    description: `Request not found`,
  })
  @ApiParam({
    name: 'requestId',
    description: 'Request id',
    type: String,
  })
  @Serialize(DriverRideRequestDto)
  @UseGuards(CanDriverAcceptRequestGuard)
  @Patch('/driver/acceptRequest/:requestId')
  driverAcceptRide(
    @Param() params: RequestIdParamDto,
    @CurrentUser() user: UserDocument,
  ) {
    // Validation happens in CanDriverAcceptRequestGuard
    return this.rideService.driverAcceptRide(params.requestId, user);
  }

  // Rider can accept the ride
  @ApiOperation({
    summary:
      'Rider Accepts The Ride - Initially or after Driver Replies once rider negotiates',
  })
  @ApiResponse({
    description: 'Ride Accepted',
    type: RiderRideRequestDto,
  })
  @ApiBadRequestResponse({
    description: `Request not found`,
  })
  @ApiParam({
    name: 'requestId',
    description: 'Request id',
    type: String,
  })
  @Serialize(RiderRideRequestDto)
  @UseGuards(CanRiderAcceptRequestGuard)
  @Patch('/rider/acceptRequest/:requestId')
  riderAcceptRide(
    @Param() params: RequestIdParamDto,
    @CurrentUser() user: UserDocument,
  ) {
    // Validation happens in CanRiderAcceptRequestGuard
    return this.rideService.riderAcceptRide(params.requestId, user);
  }

  // Rider can decline the ride
  @ApiOperation({
    summary:
      'Rider Declines The Ride - Initially or after Driver Replies once rider negotiates',
  })
  @ApiResponse({
    description: 'Ride Declined',
    type: RiderRideRequestDto,
  })
  @ApiBadRequestResponse({
    description: `Request not found`,
  })
  @ApiParam({
    name: 'requestId',
    description: 'Request id',
    type: String,
  })
  @Serialize(RiderRideRequestDto)
  @UseGuards(CanRiderDeclineRequestGuard)
  @Patch('/rider/declineRequest/:requestId')
  riderDeclinesRequest(@Param() params: RequestIdParamDto) {
    // Validation happens in CanRiderDeclineRequestGuard
    return this.rideService.riderDeclinesRequest(params.requestId);
  }

  // Rider can negotiate the ride
  @ApiOperation({
    summary: 'Rider Negotiates the Ride - Only Once allowed',
  })
  @ApiResponse({
    description: 'Ride Negotiation Success',
    type: RiderRideRequestDto,
  })
  @ApiBadRequestResponse({
    description: `Request not found`,
  })
  @ApiParam({
    name: 'requestId',
    description: 'Request id',
    type: String,
  })
  @Serialize(RiderRideRequestDto)
  @UseGuards(CanRiderNegotiateRequestGuard)
  @Patch('/rider/negotiate/:requestId')
  riderNegotiatesRequest(
    @Param() params: RequestIdParamDto,
    @Body() body: GivePriceDto,
  ) {
    // Validation happens in CanRiderNegotiateRequestGuard
    return this.rideService.riderNegotiatesPrice(params.requestId, body.price);
  }
}
