import { Module } from '@nestjs/common';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';
import { UserModule } from '../user/user.module';
import { RiderModule } from '../rider/rider.module';
import { DriverModule } from '../driver/driver.module';

@Module({
  imports: [DriverModule, UserModule, RiderModule],
  controllers: [RideController],
  providers: [RideService],
})
export class RideModule {}
