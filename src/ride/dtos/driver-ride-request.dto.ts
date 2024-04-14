import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { DriverRideRequestsStatusEnums } from '../../common/schemas/driver-ride-requests.schema';
import { RiderRideDto } from './rider-ride.dto';

export class DriverRideRequestDto {
  @ApiProperty()
  @Transform(({ obj }) => obj._id)
  @Expose()
  requestId: string;

  @ApiProperty()
  @Expose()
  driverId: string;

  @ApiProperty()
  @Type(() => RiderRideDto)
  @Expose()
  riderRideId: RiderRideDto;

  @ApiProperty({
    type: String,
    enum: DriverRideRequestsStatusEnums,
  })
  @Expose()
  status: DriverRideRequestsStatusEnums;

  @ApiProperty()
  @Expose()
  rideRequestDetails?: string;

  @ApiProperty()
  @Expose()
  canDecline: boolean;

  @ApiProperty()
  @Expose()
  canAccept: boolean;

  @ApiProperty()
  @Expose()
  acceptedPrice?: number;

  @ApiProperty()
  @Expose()
  riderRequestingPrice?: number; // only when rider negotiates

  @ApiProperty()
  @Expose()
  driverStartingPrice?: number;

  @ApiProperty()
  @Expose()
  shouldGivePrice: boolean;
}
