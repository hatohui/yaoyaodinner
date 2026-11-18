import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdatePersonPfpDto } from './dto/update-person-pfp.dto';
import { MovePeopleDto } from './dto/move-people.dto';
import { PersonDto } from './dto/person-response.dto';
import { PersonAllergyDto, SetAllergiesDto } from './dto/person-allergy.dto';
import { IdsDto } from '@common/dto/ids.dto';
import { AdminGuard } from '@common/guards/admin.guard';
import { FeatureGuard, RequireFeature } from '@common/guards/feature.guard';
import { CONFIG_KEYS } from '@common/config/registry';
import { TableAccessService } from '@modules/table-access/table-access.service';
import { TableAuditService } from '@modules/table/table-audit.service';
import { prisma } from '../../libs/prisma';

@ApiTags('people')
@Controller('people')
@UseGuards(FeatureGuard)
@RequireFeature(CONFIG_KEYS.featureTables)
export class PeopleController {
  constructor(
    private people: PeopleService,
    private access: TableAccessService,
    private audit: TableAuditService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getPeople' })
  findAll() {
    return this.people.findAll();
  }

  @Post()
  @ApiOperation({ operationId: 'createPerson' })
  @ApiResponse({ status: 201, type: PersonDto })
  async create(
    @Body() dto: CreatePersonDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forTable(dto.tableId, headers);
    const caller = await this.access.resolveActor(headers, dto.tableId);
    const created = await this.people.create(dto);
    await this.audit.logForActor(caller, 'person_added', {
      targetName: created.name,
    });
    return created;
  }

  @Post('move')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'movePeople' })
  async move(@Body() dto: MovePeopleDto) {
    const result = await this.people.move(dto.ids, dto.tableId);
    const table = dto.tableId
      ? await prisma.table.findUnique({
          where: { id: dto.tableId },
          select: { id: true, eventId: true, no: true, slot: { select: { name: true } } },
        })
      : null;
    await this.audit.log({
      action: 'people_moved',
      actor: 'admin',
      tableId: table?.id ?? null,
      eventId: table?.eventId ?? null,
      tableNo: table?.no ?? null,
      tableName: table?.slot?.name ?? null,
      details: { count: dto.ids.length, to: table ? String(table.no) : null },
    });
    return result;
  }

  @Post('bulk-delete')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'bulkDeletePeople' })
  async bulkDelete(@Body() dto: IdsDto) {
    const targets = await prisma.people.findMany({
      where: { id: { in: dto.ids } },
      select: {
        name: true,
        table: { select: { id: true, eventId: true, no: true, slot: { select: { name: true } } } },
      },
    });
    const result = await this.people.bulkRemove(dto.ids);
    await this.audit.log(
      ...targets.map((p) => ({
        action: 'person_removed' as const,
        actor: 'admin' as const,
        tableId: p.table?.id ?? null,
        eventId: p.table?.eventId ?? null,
        tableNo: p.table?.no ?? null,
        tableName: p.table?.slot?.name ?? null,
        details: { targetName: p.name },
      })),
    );
    return result;
  }

  // Guests fix names on their own table's roster, so these need its code
  @Patch(':id')
  @ApiOperation({ operationId: 'updatePerson' })
  @ApiResponse({ status: 200, type: PersonDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forPerson(id, headers);
    const before = await prisma.people.findUnique({
      where: { id },
      select: { name: true, tableId: true },
    });
    const updated = await this.people.update(id, dto);
    if (before && dto.name !== undefined && dto.name !== before.name) {
      const caller = await this.access.resolveActor(headers, before.tableId);
      await this.audit.logForActor(caller, 'person_renamed', {
        from: before.name,
        to: updated.name,
        targetName: updated.name,
      });
    }
    return updated;
  }

  @Patch(':id/pfp')
  @ApiOperation({ operationId: 'updatePersonPfp' })
  @ApiResponse({ status: 200, type: PersonDto })
  async updatePfp(
    @Param('id') id: string,
    @Body() dto: UpdatePersonPfpDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forPerson(id, headers);
    const updated = await this.people.updatePfp(id, dto);
    const caller = await this.access.resolveActor(headers, updated.tableId);
    await this.audit.logForActor(caller, 'person_pfp_changed', {
      targetName: updated.name,
      to: dto.pfpUrl ?? null,
    });
    return updated;
  }

  @Put(':id/allergies')
  @ApiOperation({ operationId: 'setPersonAllergies' })
  @ApiResponse({ status: 200, type: [PersonAllergyDto] })
  async setAllergies(
    @Param('id') id: string,
    @Body() dto: SetAllergiesDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forPerson(id, headers);
    const person = await prisma.people.findUnique({
      where: { id },
      select: { name: true, tableId: true },
    });
    const result = await this.people.setAllergies(id, dto);
    const caller = await this.access.resolveActor(headers, person?.tableId);
    await this.audit.logForActor(caller, 'person_allergies_changed', {
      targetName: person?.name,
      count: result.length,
    });
    return result;
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deletePerson' })
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forPerson(id, headers);
    const person = await prisma.people.findUnique({
      where: { id },
      select: { name: true, tableId: true },
    });
    const caller = await this.access.resolveActor(headers, person?.tableId);
    const removed = await this.people.remove(id);
    await this.audit.logForActor(caller, 'person_removed', {
      targetName: person?.name,
    });
    return removed;
  }
}
