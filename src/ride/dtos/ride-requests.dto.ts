import { DriverRideRequestDto } from './driver-ride-request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { RiderRideRequestDto } from './rider-ride-request.dto';

export class RideRequestsDto {
  @ApiProperty({
    type: [DriverRideRequestDto],
    description: 'Array of ride requests where the user is the driver',
    isArray: true,
  })
  @Type(() => DriverRideRequestDto)
  @Expose()
  requestsAsDriver: DriverRideRequestDto[];

  @ApiProperty()
  @Type(() => RiderRideRequestDto)
  @Expose()
  requestsAsRider: RiderRideRequestDto[]; // TODO change type
}
