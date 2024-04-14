import { DriverRideRequestDto } from './driver-ride-request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

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
  @Type(() => DriverRideRequestDto)
  @Expose()
  requestsAsRider: DriverRideRequestDto; // TODO change type
}
