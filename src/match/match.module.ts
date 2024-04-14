import { forwardRef, Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DriverRideScheme } from '../common/schemas/driver-ride.schema';
import { RiderRideScheme } from '../common/schemas/rider-ride.schema';
import { DriverRideRequestsSchema } from '../common/schemas/driver-ride-requests.schema';
import { SqsModule } from '../sqs/sqs.module';

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
      {
        name: 'DriverRideRequests',
        schema: DriverRideRequestsSchema,
      },
    ]),
    forwardRef(() => SqsModule),
  ],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
