import { IsEnum, IsOptional } from 'class-validator';
import { RiderRideRequestsStatusEnums } from '../../common/schemas/rider-ride-requests.schema';
import { DriverRideRequestsStatusEnums } from '../../common/schemas/driver-ride-requests.schema';

export class RideRequestsFilterDto {
  @IsOptional()
  @IsEnum(['driver', 'rider'])
  requestType?: string;

  @IsOptional()
  @IsEnum([
    ...Object.values(RiderRideRequestsStatusEnums),
    ...Object.values(DriverRideRequestsStatusEnums),
  ])
  requestStatus?: string;
}
