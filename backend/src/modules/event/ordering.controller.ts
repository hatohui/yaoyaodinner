import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventService } from './event.service';
import { OrderingStatusDto } from './dto/ordering-status.dto';

@ApiTags('ordering')
@Controller('ordering')
export class OrderingController {
  constructor(private events: EventService) {}

  @Get()
  @ApiOperation({ operationId: 'getOrderingStatus' })
  @ApiResponse({ status: 200, type: OrderingStatusDto })
  getStatus() {
    return this.events.getOrderingStatus();
  }
}
