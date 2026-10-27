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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { BatchCreateOrderDto } from './dto/batch-create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { TableAccessService } from '@modules/table-access/table-access.service';

@ApiTags('orders')
@Controller('orders')
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
    await this.access.assertOrderingOpen(headers);
    return this.order.create(dto, lang);
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
    await this.access.assertOrderingOpen(headers);
    return this.order.createBatch(dto, lang);
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
    await this.access.forOrder(id, headers);
    if (dto.quantity !== undefined) await this.access.assertOrderingOpen(headers);
    return this.order.update(id, dto, lang);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteOrder' })
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forOrder(id, headers);
    return this.order.remove(id);
  }
}
