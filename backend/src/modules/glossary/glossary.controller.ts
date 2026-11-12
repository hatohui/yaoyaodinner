import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '@common/guards/admin.guard';
import { GlossaryService } from './glossary.service';
import { GlossaryTermDto, SaveGlossaryTermDto } from './dto/glossary.dto';

@ApiTags('glossary')
@Controller('glossary')
@UseGuards(AdminGuard)
export class GlossaryController {
  constructor(private glossary: GlossaryService) {}

  @Get()
  @ApiOperation({ operationId: 'getGlossary' })
  @ApiResponse({ status: 200, type: [GlossaryTermDto] })
  list() {
    return this.glossary.list();
  }

  @Post()
  @ApiOperation({ operationId: 'createGlossaryTerm' })
  @ApiResponse({ status: 201, type: GlossaryTermDto })
  create(@Body() dto: SaveGlossaryTermDto) {
    return this.glossary.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateGlossaryTerm' })
  @ApiResponse({ status: 200, type: GlossaryTermDto })
  update(@Param('id') id: string, @Body() dto: SaveGlossaryTermDto) {
    return this.glossary.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteGlossaryTerm' })
  remove(@Param('id') id: string) {
    return this.glossary.remove(id);
  }
}
