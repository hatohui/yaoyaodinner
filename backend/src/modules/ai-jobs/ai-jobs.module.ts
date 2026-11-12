import { Global, Module } from '@nestjs/common';
import { AiJobsService } from './ai-jobs.service';
import { ImagesModule } from '@modules/images/images.module';

@Global()
@Module({
  imports: [ImagesModule],
  providers: [AiJobsService],
  exports: [AiJobsService],
})
export class AiJobsModule {}
