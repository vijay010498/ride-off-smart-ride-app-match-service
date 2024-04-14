import { forwardRef, Module } from '@nestjs/common';
import { SqsProcessorService } from './sqs_processor.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../common/schemas/user.schema';
import { UserTokenBlacklistSchema } from '../common/schemas/user-token-blacklist.schema';
import { UserVehicleSchema } from '../common/schemas/user-vehicle.schema';
import { DriverRideScheme } from '../common/schemas/driver-ride.schema';
import { RiderRideScheme } from '../common/schemas/rider-ride.schema';
import { MatchModule } from '../match/match.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'User',
        schema: UserSchema,
      },
      {
        name: 'UserTokenBlacklist',
        schema: UserTokenBlacklistSchema,
      },
      {
        name: 'UserVehicle',
        schema: UserVehicleSchema,
      },
      {
        name: 'DriverRide',
        schema: DriverRideScheme,
      },
      {
        name: 'RiderRide',
        schema: RiderRideScheme,
      },
    ]),
    forwardRef(() => MatchModule),
  ],
  providers: [SqsProcessorService],
  exports: [SqsProcessorService],
})
export class SqsProcessorModule {}
