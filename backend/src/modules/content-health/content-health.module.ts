import { Module } from '@nestjs/common';
import { ContentHealthController } from './content-health.controller';
import { ContentHealthService } from './content-health.service';
import { ImagesModule } from '@modules/images/images.module';

@Module({
  imports: [ImagesModule],
  controllers: [ContentHealthController],
  providers: [ContentHealthService],
})
export class ContentHealthModule {}
