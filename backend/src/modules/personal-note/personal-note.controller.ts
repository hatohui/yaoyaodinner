import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PersonalNoteService } from './personal-note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { TableAccessService } from '@modules/table-access/table-access.service';

@ApiTags('personal-notes')
@Controller('personal-notes')
export class PersonalNoteController {
  constructor(
    private notes: PersonalNoteService,
    private access: TableAccessService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getNotesByPerson' })
  @ApiQuery({ name: 'personId', required: true, type: String })
  @ApiResponse({ status: 200, type: [NoteResponseDto] })
  findByPerson(@Query('personId') personId: string) {
    return this.notes.findByPerson(personId);
  }

  @Post()
  @ApiOperation({ operationId: 'createNote' })
  @ApiResponse({ status: 201, type: NoteResponseDto })
  async create(
    @Body() dto: CreateNoteDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forPerson(dto.personId, headers);
    return this.notes.create(dto);
  }

  @Put()
  @ApiOperation({ operationId: 'upsertNote' })
  @ApiResponse({ status: 200, type: NoteResponseDto })
  async upsert(
    @Body() dto: CreateNoteDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forPerson(dto.personId, headers);
    return this.notes.upsert(dto);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteNote' })
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forNote(id, headers);
    return this.notes.remove(id);
  }
}
