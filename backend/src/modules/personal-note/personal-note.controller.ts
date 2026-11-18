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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PersonalNoteService } from './personal-note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { TableAccessService } from '@modules/table-access/table-access.service';
import { TableAuditService } from '@modules/table/table-audit.service';
import { FeatureGuard, RequireFeature } from '@common/guards/feature.guard';
import { CONFIG_KEYS } from '@common/config/registry';
import { prisma } from '../../libs/prisma';

@ApiTags('personal-notes')
@Controller('personal-notes')
@UseGuards(FeatureGuard)
@RequireFeature(CONFIG_KEYS.featureTables)
export class PersonalNoteController {
  constructor(
    private notes: PersonalNoteService,
    private access: TableAccessService,
    private audit: TableAuditService,
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
    const person = await prisma.people.findUnique({
      where: { id: dto.personId },
      select: { name: true, tableId: true },
    });
    const created = await this.notes.create(dto);
    const caller = await this.access.resolveActor(headers, person?.tableId);
    await this.audit.logForActor(caller, 'note_saved', {
      targetName: person?.name,
    });
    return created;
  }

  @Put()
  @ApiOperation({ operationId: 'upsertNote' })
  @ApiResponse({ status: 200, type: NoteResponseDto })
  async upsert(
    @Body() dto: CreateNoteDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forPerson(dto.personId, headers);
    const person = await prisma.people.findUnique({
      where: { id: dto.personId },
      select: { name: true, tableId: true },
    });
    const saved = await this.notes.upsert(dto);
    const caller = await this.access.resolveActor(headers, person?.tableId);
    await this.audit.logForActor(caller, 'note_saved', {
      targetName: person?.name,
    });
    return saved;
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteNote' })
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forNote(id, headers);
    const note = await prisma.personalNote.findUnique({
      where: { id },
      select: { person: { select: { name: true, tableId: true } } },
    });
    const caller = await this.access.resolveActor(headers, note?.person.tableId);
    const removed = await this.notes.remove(id);
    await this.audit.logForActor(caller, 'note_removed', {
      targetName: note?.person.name,
    });
    return removed;
  }
}
