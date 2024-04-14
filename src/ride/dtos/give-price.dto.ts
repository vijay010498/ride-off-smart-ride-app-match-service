import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class GivePriceDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  driverStartingPrice: number;
}
