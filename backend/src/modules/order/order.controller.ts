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
import { TableAuditService } from '@modules/table/table-audit.service';
import { FeatureGuard, RequireFeature } from '@common/guards/feature.guard';
import { CONFIG_KEYS } from '@common/config/registry';
import { prisma } from '../../libs/prisma';

@ApiTags('orders')
@Controller('orders')
@UseGuards(FeatureGuard)
@RequireFeature(CONFIG_KEYS.featureTables, CONFIG_KEYS.featureMenu)
export class OrderController {
  constructor(
    private order: OrderService,
    private access: TableAccessService,
    private audit: TableAuditService,
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
    const caller = await this.access.resolveActor(headers, dto.tableId);
    const created = await this.order.create(dto, round, lang);
    await this.audit.logForActor(caller, 'order_added', {
      targetName: created.foodName,
      count: created.quantity,
    });
    return created;
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
    const caller = await this.access.resolveActor(headers, dto.tableId);
    const created = await this.order.createBatch(dto, round, lang);
    for (const o of created) {
      await this.audit.logForActor(caller, 'order_added', {
        targetName: o.foodName,
        count: o.quantity,
      });
    }
    return created;
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
    const caller = await this.access.resolveActor(headers, dto.tableId);
    const cutOrders = dto.cuts.length
      ? await prisma.order.findMany({
          where: { id: { in: dto.cuts.map((c) => c.orderId) } },
          select: {
            id: true,
            quantity: true,
            variant: { select: { food: { select: { translations: { where: { language: 'en' }, select: { name: true } } } } } },
          },
        })
      : [];
    const addVariants = dto.adds.length
      ? await prisma.foodVariant.findMany({
          where: { id: { in: dto.adds.map((a) => a.variantId) } },
          select: {
            id: true,
            food: { select: { translations: { where: { language: 'en' }, select: { name: true } } } },
          },
        })
      : [];
    await this.order.applyChanges(dto, round);
    const variantNames = new Map(
      addVariants.map((v) => [v.id, v.food.translations[0]?.name ?? '']),
    );
    const cutMap = new Map(cutOrders.map((o) => [o.id, o]));
    for (const add of dto.adds) {
      await this.audit.logForActor(caller, 'order_added', {
        targetName: variantNames.get(add.variantId) ?? '',
        count: add.quantity,
      });
    }
    for (const cut of dto.cuts) {
      const existing = cutMap.get(cut.orderId);
      const name = existing?.variant.food.translations[0]?.name ?? '';
      const remaining = (existing?.quantity ?? 0) - cut.quantity;
      await this.audit.logForActor(
        caller,
        remaining <= 0 ? 'order_removed' : 'order_updated',
        { targetName: name, count: remaining <= 0 ? cut.quantity : remaining },
      );
    }
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
    const updated = await this.order.update(id, dto, lang);
    const caller = await this.access.resolveActor(headers, updated.tableId);
    await this.audit.logForActor(caller, 'order_updated', {
      targetName: updated.foodName,
      count: updated.quantity,
    });
    return updated;
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteOrder' })
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forOrderChange(id, headers, { items: true });
    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        tableId: true,
        quantity: true,
        variant: { select: { food: { select: { translations: { where: { language: 'en' }, select: { name: true } } } } } },
      },
    });
    const caller = await this.access.resolveActor(headers, existing?.tableId);
    const removed = await this.order.remove(id);
    if (existing) {
      await this.audit.logForActor(caller, 'order_removed', {
        targetName: existing.variant.food.translations[0]?.name ?? '',
        count: existing.quantity,
      });
    }
    return removed;
  }
}
