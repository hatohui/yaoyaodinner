import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { BatchCreateOrderDto } from './dto/batch-create-order.dto';
import { ApplyOrderChangesDto } from './dto/apply-order-changes.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { TableAccessService } from '@modules/table-access/table-access.service';
import { FeatureGuard, RequireFeature } from '@common/guards/feature.guard';
import { CONFIG_KEYS } from '@common/config/registry';

@ApiTags('orders')
@Controller('orders')
@UseGuards(FeatureGuard)
@RequireFeature(CONFIG_KEYS.featureTables, CONFIG_KEYS.featureMenu)
export class OrderController {
  constructor(
    private order: OrderService,
    private access: TableAccessService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getOrders' })
  @ApiQuery({ name: 'tableId', required: false, type: String })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  findAll(@Query('tableId') tableId?: string, @Query('lang') lang = 'en') {
    if (tableId) return this.order.findByTable(tableId, lang);
    return this.order.findAll(lang);
  }

  @Post()
  @ApiOperation({ operationId: 'createOrder' })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(
    @Body() dto: CreateOrderDto,
    @Headers() headers: Record<string, string>,
    @Query('lang') lang = 'en',
  ) {
    await this.access.forTable(dto.tableId, headers);
    const round = await this.access.roundForNewOrder(dto.tableId, headers);
    return this.order.create(dto, round, lang);
  }

  @Post('batch')
  @ApiOperation({ operationId: 'createOrderBatch' })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 201, type: [OrderResponseDto] })
  async createBatch(
    @Body() dto: BatchCreateOrderDto,
    @Headers() headers: Record<string, string>,
    @Query('lang') lang = 'en',
  ) {
    await this.access.forTable(dto.tableId, headers);
    const round = await this.access.roundForNewOrder(dto.tableId, headers);
    return this.order.createBatch(dto, round, lang);
  }

  @Post('apply-changes')
  @ApiOperation({ operationId: 'applyOrderChanges' })
  @ApiResponse({ status: 201, description: 'Every change applied, or none' })
  async applyChanges(
    @Body() dto: ApplyOrderChangesDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forTable(dto.tableId, headers);
    const round =
      dto.adds.length > 0 ? await this.access.roundForNewOrder(dto.tableId, headers) : null;
    // each trimmed order must belong to this table and still be open for changes
    for (const cut of dto.cuts)
      await this.access.forOrderChange(cut.orderId, headers, { items: true });
    await this.order.applyChanges(dto, round);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateOrder' })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Headers() headers: Record<string, string>,
    @Query('lang') lang = 'en',
  ) {
    await this.access.forOrderChange(id, headers, {
      items: dto.quantity !== undefined,
      price: dto.price !== undefined,
    });
    return this.order.update(id, dto, lang);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteOrder' })
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forOrderChange(id, headers, { items: true });
    return this.order.remove(id);
  }
}
