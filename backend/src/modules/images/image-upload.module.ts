import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesModule } from './images.module';
import { TableAccessModule } from '@modules/table-access/table-access.module';

@Module({
  imports: [ImagesModule, TableAccessModule],
  controllers: [ImagesController],
})
export class ImageUploadModule {}
