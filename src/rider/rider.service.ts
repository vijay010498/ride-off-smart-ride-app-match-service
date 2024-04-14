import { Injectable, Logger } from '@nestjs/common';
import { UserDocument } from '../common/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RiderRideDocument } from '../common/schemas/rider-ride.schema';

@Injectable()
export class RiderService {
  private readonly logger = new Logger(RiderService.name);

  constructor(
    @InjectModel('RiderRide')
    private readonly riderRideCollection: Model<RiderRideDocument>,
  ) {}

  async getRides(user: UserDocument) {
    return this.riderRideCollection
      .find({
        userId: user.id,
      })
      .exec();
  }
}
