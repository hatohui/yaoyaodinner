import { TableAccessModule } from '@modules/table-access/table-access.module';
import { Module } from '@nestjs/common';
import { PersonalNoteController } from './personal-note.controller';
import { PersonalNoteService } from './personal-note.service';

@Module({
  imports: [TableAccessModule],
  controllers: [PersonalNoteController],
  providers: [PersonalNoteService],
})
export class PersonalNoteModule {}
