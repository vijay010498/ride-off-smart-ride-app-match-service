import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DriverRideScheme } from '../common/schemas/driver-ride.schema';
import { RiderRideScheme } from '../common/schemas/rider-ride.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'DriverRide',
        schema: DriverRideScheme,
      },
      {
        name: 'RiderRide',
        schema: RiderRideScheme,
      },
    ]),
  ],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
