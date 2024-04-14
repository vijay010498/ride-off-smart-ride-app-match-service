import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument } from '../common/schemas/user.schema';
import { UserTokenBlacklistDocument } from '../common/schemas/user-token-blacklist.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectModel('User') private readonly userCollection: Model<UserDocument>,
    @InjectModel('UserTokenBlacklist')
    private readonly UserTokenBlacklistCollection: Model<UserTokenBlacklistDocument>,
  ) {}

  async findById(id: string) {
    return this.userCollection.findById(id);
  }

  async tokenInBlackList(accessToken: string) {
    return this.UserTokenBlacklistCollection.findOne({
      token: accessToken,
    });
  }
}
