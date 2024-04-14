import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RiderService } from '../../rider/rider.service';

@Injectable()
export class CanRiderAcceptRequestGuard implements CanActivate {
  private readonly logger = new Logger(CanRiderAcceptRequestGuard.name);

  constructor(private readonly riderService: RiderService) {}
  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest();
      const userId = request.user?.sub;
      const params = request.params;
      const { requestId } = params;

      if (!userId || !requestId) return false;

      const riderRequest = await this.riderService.getRequest(
        requestId,
        userId,
      );

      if (!riderRequest) {
        throw new BadRequestException('Request Not Found');
      }

      if (!riderRequest.canAccept) {
        throw new BadRequestException('Cannot Accept Ride Now');
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error in CanRiderAcceptRequestGuard:', error);
      return false;
    }
  }
}
