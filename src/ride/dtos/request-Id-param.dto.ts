import { IsMongoId, IsNotEmpty } from 'class-validator';

export class RequestIdParamDto {
  @IsMongoId()
  @IsNotEmpty()
  requestId: string;
}
