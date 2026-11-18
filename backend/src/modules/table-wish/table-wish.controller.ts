import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FeatureGuard, RequireFeature } from '@common/guards/feature.guard';
import { CONFIG_KEYS } from '@common/config/registry';
import { TableAccessService } from '@modules/table-access/table-access.service';
import { TableAuditService } from '@modules/table/table-audit.service';
import { TableWishService } from './table-wish.service';
import {
  CreateTableWishDto,
  TableWishDto,
  UpdateTableWishDto,
} from './dto/table-wish.dto';

@ApiTags('wishes')
@Controller('wishes')
@UseGuards(FeatureGuard)
@RequireFeature(CONFIG_KEYS.featureTables)
export class TableWishController {
  constructor(
    private wishes: TableWishService,
    private access: TableAccessService,
    private audit: TableAuditService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getTableWishes' })
  @ApiQuery({ name: 'tableId', required: true, type: String })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 200, type: [TableWishDto] })
  findByTable(@Query('tableId') tableId: string, @Query('lang') lang = 'en') {
    return this.wishes.findByTable(tableId, lang);
  }

  @Post()
  @ApiOperation({ operationId: 'createTableWish' })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 201, type: TableWishDto })
  async create(
    @Body() dto: CreateTableWishDto,
    @Query('lang') lang = 'en',
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forTable(dto.tableId, headers);
    const caller = await this.access.resolveActor(headers, dto.tableId);
    const wish = await this.wishes.create(dto, lang, caller.person);
    await this.audit.logForActor(caller, 'wish_added', {
      targetName: wish.name,
      to: wish.kind,
    });
    return wish;
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateTableWish' })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 200, type: TableWishDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTableWishDto,
    @Query('lang') lang = 'en',
    @Headers() headers: Record<string, string>,
  ) {
    const tableId = await this.wishes.tableOf(id);
    await this.access.forTable(tableId, headers);
    const caller = await this.access.resolveActor(headers, tableId);
    const wish = await this.wishes.update(id, dto, lang);
    if (
      dto.kind !== undefined ||
      dto.variantId !== undefined ||
      dto.personIds !== undefined
    ) {
      await this.audit.logForActor(caller, 'wish_updated', {
        targetName: wish.name,
        to: dto.kind ?? wish.kind,
      });
    }
    return wish;
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteTableWish' })
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
  ) {
    const tableId = await this.wishes.tableOf(id);
    await this.access.forTable(tableId, headers);
    const caller = await this.access.resolveActor(headers, tableId);
    const removed = await this.wishes.remove(id);
    await this.audit.logForActor(caller, 'wish_removed', {
      targetName: removed.name,
      from: removed.kind,
    });
  }
}
