import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DriverRideScheme } from '../common/schemas/driver-ride.schema';
import { UserVehicleSchema } from '../common/schemas/user-vehicle.schema';
import { MyConfigModule } from '../my-config/my-config.module';
import { DriverRideRequestsSchema } from '../common/schemas/driver-ride-requests.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'DriverRide',
        schema: DriverRideScheme,
      },
      {
        name: 'UserVehicle',
        schema: UserVehicleSchema,
      },
      {
        name: 'DriverRideRequests',
        schema: DriverRideRequestsSchema,
      },
    ]),
    MyConfigModule,
  ],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
