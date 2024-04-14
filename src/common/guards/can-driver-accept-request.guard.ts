import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DriverService } from '../../driver/driver.service';

@Injectable()
export class CanDriverAcceptRequestGuard implements CanActivate {
  private readonly logger = new Logger(CanDriverAcceptRequestGuard.name);

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

      if (!driverRequest.canAccept || !driverRequest.riderRequestingPrice) {
        throw new BadRequestException('Cannot Accept the ride');
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error in CanDriverAcceptRequestGuard:', error);
      return false;
    }
  }
}
