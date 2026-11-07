import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PresetMenuService } from './preset-menu.service';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { AddPresetItemDto, UpdatePresetItemDto } from './dto/preset-item.dto';
import { PresetMenuDto } from './dto/preset-menu-response.dto';
import { AdminGuard } from '@common/guards/admin.guard';
import { FeatureGuard, RequireFeature } from '@common/guards/feature.guard';
import { CONFIG_KEYS } from '@common/config/registry';

@ApiTags('preset-menus')
@Controller('preset-menus')
@UseGuards(FeatureGuard)
@RequireFeature(CONFIG_KEYS.featureMenu)
export class PresetMenuController {
  constructor(private preset: PresetMenuService) {}

  @Get()
  @ApiOperation({ operationId: 'getPresetMenus' })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiResponse({ status: 200, type: [PresetMenuDto] })
  findAll(
    @Query('lang') lang = 'en',
    @Query('eventId') eventId?: string,
  ) {
    return this.preset.findAll(lang, eventId);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getPresetMenuById' })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 200, type: PresetMenuDto })
  findOne(@Param('id') id: string, @Query('lang') lang = 'en') {
    return this.preset.findOne(id, lang);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'createPresetMenu' })
  @ApiResponse({ status: 201, type: PresetMenuDto })
  create(@Body() dto: CreatePresetDto) {
    return this.preset.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'updatePresetMenu' })
  @ApiResponse({ status: 200, type: PresetMenuDto })
  update(@Param('id') id: string, @Body() dto: UpdatePresetDto) {
    return this.preset.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'deletePresetMenu' })
  remove(@Param('id') id: string) {
    return this.preset.remove(id);
  }

  @Post(':id/items')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'addPresetMenuItem' })
  @ApiResponse({ status: 201, type: PresetMenuDto })
  addItem(@Param('id') id: string, @Body() dto: AddPresetItemDto) {
    return this.preset.addItem(id, dto);
  }

  @Patch(':id/items/:variantId')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'updatePresetMenuItem' })
  @ApiResponse({ status: 200, type: PresetMenuDto })
  updateItem(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdatePresetItemDto,
  ) {
    return this.preset.updateItem(id, variantId, dto);
  }

  @Delete(':id/items/:variantId')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'removePresetMenuItem' })
  @ApiResponse({ status: 200, type: PresetMenuDto })
  removeItem(@Param('id') id: string, @Param('variantId') variantId: string) {
    return this.preset.removeItem(id, variantId);
  }
}
