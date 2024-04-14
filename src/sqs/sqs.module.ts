import { forwardRef, Module } from '@nestjs/common';
import { SqsService } from './sqs.service';
import { MyConfigModule } from '../my-config/my-config.module';
import { SqsProcessorModule } from '../sqs_processor/sqs_processor.module';

@Module({
  imports: [MyConfigModule, forwardRef(() => SqsProcessorModule)],
  providers: [SqsService],
  exports: [SqsService],
})
export class SqsModule {}
