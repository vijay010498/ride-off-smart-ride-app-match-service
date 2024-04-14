import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { DriverRideDto } from './driver-ride.dto';
import { RiderRideRequestsStatusEnums } from '../../common/schemas/rider-ride-requests.schema';
import { RiderRideDto } from './rider-ride.dto';

export class RiderRideRequestDto {
  @ApiProperty()
  @Transform(({ obj }) => obj._id)
  @Expose()
  requestId: string;

  @ApiProperty()
  @Expose()
  riderId: string;

  @ApiProperty()
  @Type(() => DriverRideDto)
  @Expose()
  driverRideId: DriverRideDto;

  @ApiProperty()
  @Type(() => RiderRideDto)
  @Expose()
  riderRideId: RiderRideDto;

  @ApiProperty()
  @Expose()
  driverRideRequestId: string;

  @ApiProperty({
    type: String,
    enum: RiderRideRequestsStatusEnums,
  })
  @Expose()
  status: RiderRideRequestsStatusEnums;

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
  canNegotiate: boolean;

  @ApiProperty()
  @Expose()
  acceptedPrice?: number;

  @ApiProperty()
  @Expose()
  priceByDriver: number;

  @ApiProperty()
  @Expose()
  negotiatedPrice: number;
}
