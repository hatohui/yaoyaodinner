import {
  Controller,
  Get,
  Query,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { SignUrlResponseDto } from './dto/sign-url-response.dto';
import { TableAccessService } from '@modules/table-access/table-access.service';
import { RateLimit, RateLimitGuard } from '@common/guards/rate-limit.guard';
import { CONFIG_KEYS } from '@common/config/registry';

const UPLOAD_FOLDERS = [
  'foods',
  'feedback-images',
  'person-pfps',
  'table-banners',
] as const;

type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

@ApiTags('images')
@Controller('images')
@UseGuards(RateLimitGuard)
export class ImagesController {
  constructor(
    private images: ImagesService,
    private access: TableAccessService,
  ) {}

  @Get('sign-url')
  @RateLimit(30, 60)
  @ApiOperation({ operationId: 'getSignedUrl' })
  @ApiQuery({ name: 'folder', required: true, type: String })
  @ApiResponse({ status: 200, type: SignUrlResponseDto })
  async signUrl(
    @Query('folder') folder: string,
    @Headers() headers: Record<string, string>,
  ) {
    if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
      throw new BadRequestException('Invalid upload folder');
    }

    if (folder === 'foods') {
      await this.access.requireAdmin(headers);
    } else if (folder === 'feedback-images') {
      await this.access.requireFeature(CONFIG_KEYS.featureFeedbackWall, headers);
      await this.access.forEventPin(headers);
    } else {
      await this.access.requireFeature(CONFIG_KEYS.featureTables, headers);
      await this.access.forHeldTable(headers);
    }

    return this.images.signUrl(folder);
  }
}
