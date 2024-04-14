import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DriverService } from '../../driver/driver.service';
import { DriverRideRequestsStatusEnums } from '../schemas/driver-ride-requests.schema';

@Injectable()
export class CanDriverGiveStartingPriceGuard implements CanActivate {
  private readonly logger = new Logger(CanDriverGiveStartingPriceGuard.name);

  constructor(private readonly driverService: DriverService) {}
  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest();
      const userId = request.user?.sub;
      const params = request.params;
      const { requestId } = params;

      if (!userId || !requestId) return false;

      const driverRequest = await this.driverService.getRequest(
        requestId,
        userId,
      );

      if (!driverRequest) {
        throw new BadRequestException('Request Not Found');
      }

      // to give starting price the status should be  // WAITING_FOR_DRIVER_RESPONSE
      if (
        driverRequest.status !==
          DriverRideRequestsStatusEnums.WAITING_FOR_DRIVER_RESPONSE ||
        !driverRequest.shouldGivePrice
      ) {
        throw new BadRequestException(
          'Please Wait for Rider Response / cannot give price now',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error in IsSignedUpGuard:', error);
      return false;
    }
  }
}
