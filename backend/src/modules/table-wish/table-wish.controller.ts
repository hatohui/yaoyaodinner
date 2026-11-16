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
    return this.wishes.create(dto, lang);
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
    await this.access.forTable(await this.wishes.tableOf(id), headers);
    return this.wishes.update(id, dto, lang);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteTableWish' })
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forTable(await this.wishes.tableOf(id), headers);
    return this.wishes.remove(id);
  }
}
