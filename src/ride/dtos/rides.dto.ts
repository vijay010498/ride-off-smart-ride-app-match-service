import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DriverRideDto } from './driver-ride.dto';
import { RiderRideDto } from './rider-ride.dto';

export class RidesDto {
  @ApiProperty({
    type: [DriverRideDto],
    description: 'Array of Rides as Driver',
    isArray: true,
  })
  @Type(() => DriverRideDto)
  @Expose()
  ridesAsDriver: DriverRideDto[];

  @ApiProperty({
    type: [RiderRideDto],
    description: 'Array of Rides as Rider',
    isArray: true,
  })
  @Type(() => RiderRideDto)
  @Expose()
  ridesAsRider: RiderRideDto[];
}
