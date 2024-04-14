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
import { DriverService } from '../driver/driver.service';
import { RiderService } from '../rider/rider.service';
import { DriverRideDto } from './dtos/driver-ride.dto';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../common/schemas/user.schema';
import { RiderRideDto } from './dtos/rider-ride.dto';
import { RideRequestsFilterDto } from './dtos/ride-requests.filter.dto';
import { RideService } from './ride.service';
import { RideRequestsDto } from './dtos/ride-requests.dto';
import { DriverRideRequestDto } from './dtos/driver-ride-request.dto';
import { RequestIdParamDto } from './dtos/request-Id-param.dto';
import { GivePriceDto } from './dtos/give-price.dto';
import { CanDriverDeclineRequestGuard } from '../common/guards/can-driver-decline-request.guard';
import { CanDriverAcceptRequestGuard } from '../common/guards/can-driver-accept-request.guard';
import { CanDriverGiveStartingPriceGuard } from '../common/guards/can-driver-give-starting-price.guard';

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
  constructor(
    private readonly driverService: DriverService,
    private readonly riderService: RiderService,
    private readonly rideService: RideService,
  ) {}

  @Get('/driver')
  @ApiOperation({
    summary: 'Get User Driver Rides',
  })
  @ApiResponse({
    description: 'Get Driver Rides',
    type: [DriverRideDto],
  })
  @Serialize(DriverRideDto)
  getUserDriverRides(@CurrentUser() user: UserDocument) {
    return this.driverService.getRides(user);
  }

  @Get('/rider')
  @ApiOperation({
    summary: 'Get User Rider Rides',
  })
  @ApiResponse({
    description: 'Get Rider Rides',
    type: [RiderRideDto],
  })
  @Serialize(RiderRideDto)
  getUserRiderRides(@CurrentUser() user: UserDocument) {
    return this.riderService.getRides(user);
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
    return this.rideService.driverGivesPrice(
      params.requestId,
      body.driverStartingPrice,
    );
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
  @Patch('/driver/declineRide/:requestId')
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
  @Patch('/driver/acceptRide/:requestId')
  driverAcceptRide(
    @Param() params: RequestIdParamDto,
    @CurrentUser() user: UserDocument,
  ) {
    // Validation happens in CanDriverAcceptRequestGuard
    return this.rideService.driverAcceptRide(params.requestId, user);
  }
}
