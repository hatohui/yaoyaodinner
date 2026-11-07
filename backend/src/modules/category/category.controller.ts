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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { CategoryService } from "./category.service";
import { CategoryItemDto } from "./dto/category-response.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { AdminGuard } from "@common/guards/admin.guard";
import { FeatureGuard, RequireFeature } from "@common/guards/feature.guard";
import { CONFIG_KEYS } from "@common/config/registry";
import { BulkToggleDto } from "@common/dto/bulk-toggle.dto";
import { IdsDto } from "@common/dto/ids.dto";

@ApiTags("categories")
@Controller("categories")
@UseGuards(FeatureGuard)
@RequireFeature(CONFIG_KEYS.featureMenu)
export class CategoryController {
  constructor(private category: CategoryService) {}

  @Get()
  @ApiOperation({ operationId: "getCategories" })
  @ApiQuery({ name: "lang", required: false, type: String, example: "en" })
  @ApiResponse({ status: 200, type: [CategoryItemDto] })
  findAll(@Query("lang") lang = "en") {
    return this.category.findAll(lang);
  }

  @Get(":id")
  @ApiOperation({ operationId: "getCategoryById" })
  @ApiQuery({ name: "lang", required: false, type: String, example: "en" })
  @ApiResponse({ status: 200, type: CategoryItemDto })
  findOne(@Param("id") id: string, @Query("lang") lang = "en") {
    return this.category.findOne(id, lang);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: "createCategory" })
  @ApiResponse({ status: 201, type: CategoryItemDto })
  create(@Body() dto: CreateCategoryDto) {
    return this.category.create(dto);
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: "updateCategory" })
  @ApiResponse({ status: 200, type: CategoryItemDto })
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.category.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: "deleteCategory" })
  remove(@Param("id") id: string) {
    return this.category.remove(id);
  }

  @Post("bulk-toggle")
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: "bulkToggleCategories" })
  bulkToggle(@Body() dto: BulkToggleDto) {
    return this.category.bulkToggle(dto.ids, dto.isAvailable);
  }

  @Post("bulk-delete")
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: "bulkDeleteCategories" })
  bulkDelete(@Body() dto: IdsDto) {
    return this.category.bulkRemove(dto.ids);
  }
}
