import { Module } from '@nestjs/common';
import { RiderService } from './rider.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RiderRideScheme } from '../common/schemas/rider-ride.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'RiderRide',
        schema: RiderRideScheme,
      },
    ]),
  ],
  providers: [RiderService],
  exports: [RiderService],
})
export class RiderModule {}
