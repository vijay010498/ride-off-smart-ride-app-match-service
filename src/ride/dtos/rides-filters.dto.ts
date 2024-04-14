import { IsEnum, IsOptional } from 'class-validator';

export class RidesFiltersDto {
  @IsOptional()
  @IsEnum(['driver', 'rider'])
  requestType?: string;
}
