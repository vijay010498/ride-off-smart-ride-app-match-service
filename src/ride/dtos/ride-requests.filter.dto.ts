import { IsEnum, IsOptional } from 'class-validator';

export class RideRequestsFilterDto {
  @IsOptional()
  @IsEnum(['driver', 'rider'])
  requestType?: string;
}
