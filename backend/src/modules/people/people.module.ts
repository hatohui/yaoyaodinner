import { TableAccessModule } from '@modules/table-access/table-access.module';
import { Module } from '@nestjs/common';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { ImagesModule } from '@modules/images/images.module';

@Module({
  imports: [ImagesModule, TableAccessModule],
  controllers: [PeopleController],
  providers: [PeopleService],
  exports: [PeopleService],
})
export class PeopleModule {}
