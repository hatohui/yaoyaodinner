import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { TableService } from './table.service';
import { PeopleService } from '@modules/people/people.service';
import { AdminGuard } from '@common/guards/admin.guard';
import { IdsDto } from '@common/dto/ids.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { BulkCreateTableDto } from './dto/bulk-create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateTableDetailsDto } from './dto/update-table-details.dto';
import { TablePositionDto } from './dto/table-position.dto';
import { ReassignTablesDto } from './dto/reassign-tables.dto';
import { TableDto, TableListDto } from './dto/table-response.dto';
import {
  TableCodeDto,
  TableCodeResponseDto,
  TableCodeVerifyResponseDto,
} from './dto/table-code.dto';
import { PersonDto } from '@modules/people/dto/person-response.dto';

@ApiTags('tables')
@Controller('tables')
export class TableController {
  constructor(
    private table: TableService,
    private people: PeopleService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getTables' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiResponse({ status: 200, type: TableListDto })
  findAll(
    @Query('page') page = '1',
    @Query('count') count = '20',
    @Query('search') search?: string,
    @Query('eventId') eventId?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const countNum = Math.min(100, Math.max(1, parseInt(count, 10) || 20));
    return this.table.findForEvent(pageNum, countNum, search, eventId);
  }

  @Get('staged')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'getStagedTables' })
  @ApiResponse({ status: 200, type: [TableDto] })
  findStaged() {
    return this.table.findStaged();
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getTableById' })
  @ApiResponse({ status: 200, type: TableDto })
  findOne(@Param('id') id: string) {
    return this.table.findOne(id);
  }

  @Get(':id/people')
  @ApiOperation({ operationId: 'getTablePeople' })
  @ApiResponse({ status: 200, type: [PersonDto] })
  getPeopleInTable(@Param('id') id: string) {
    return this.people.findByTableId(id);
  }

  @Get(':id/code')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'getTableCode' })
  @ApiResponse({ status: 200, type: TableCodeResponseDto })
  getCode(@Param('id') id: string) {
    return this.table.getCode(id);
  }

  @Post(':id/code/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'verifyTableCode' })
  @ApiResponse({ status: 200, type: TableCodeVerifyResponseDto })
  verifyCode(@Param('id') id: string, @Body() dto: TableCodeDto) {
    return this.table.verifyCode(id, dto.code);
  }

  @Post(':id/code/reroll')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'rerollTableCode' })
  @ApiResponse({ status: 201, type: TableCodeResponseDto })
  rerollCode(@Param('id') id: string) {
    return this.table.rerollCode(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'createTable' })
  @ApiResponse({ status: 201, type: TableDto })
  create(@Body() dto: CreateTableDto) {
    return this.table.create(dto);
  }

  @Post('bulk')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'bulkCreateTables' })
  bulkCreate(@Body() dto: BulkCreateTableDto) {
    return this.table.bulkCreate(dto);
  }

  @Post('bulk-delete')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'bulkDeleteTables' })
  bulkDelete(@Body() dto: IdsDto) {
    return this.table.bulkRemove(dto.ids);
  }

  @Post('reassign')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'reassignTables' })
  reassign(@Body() dto: ReassignTablesDto) {
    return this.table.bulkReassign(dto.ids, dto.eventId ?? null);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'updateTable' })
  @ApiResponse({ status: 200, type: TableDto })
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.table.update(id, dto);
  }

  @Patch(':id/details')
  @ApiOperation({ operationId: 'updateTableDetails' })
  @ApiResponse({ status: 200, type: TableDto })
  updateDetails(@Param('id') id: string, @Body() dto: UpdateTableDetailsDto) {
    return this.table.updateDetails(id, dto);
  }

  @Patch(':id/position')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'updateTablePosition' })
  updatePosition(@Param('id') id: string, @Body() dto: TablePositionDto) {
    return this.table.updatePosition(id, dto.x, dto.y);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'deleteTable' })
  remove(@Param('id') id: string) {
    return this.table.remove(id);
  }
}
