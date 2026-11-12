import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class FoodContentIssueDto {
  @ApiProperty() id: string;
  @ApiProperty({ description: 'Name in the requested locale, else any locale' })
  name: string;
  @ApiProperty({ nullable: true, type: String }) imageUrl: string | null;
  @ApiProperty() categoryId: string;
  @ApiProperty() isAvailable: boolean;
  @ApiProperty({
    type: [String],
    description:
      'Locales missing the name, a description other locales have, or a variant label',
  })
  missingTranslations: string[];
  @ApiProperty({ type: [String], required: false })
  missingNames?: string[];
  @ApiProperty({ type: [String], required: false })
  missingDescriptions?: string[];
  @ApiProperty({ type: [String], required: false })
  missingVariants?: string[];
  @ApiProperty({ type: [String], required: false })
  variantLabels?: string[];
  @ApiProperty({ description: 'No locale has a description' })
  missingDescription: boolean;
  @ApiProperty() missingImage: boolean;
}

export class CategoryContentIssueDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() isAvailable: boolean;
  @ApiProperty({ type: [String] }) missingTranslations: string[];
  @ApiProperty({ type: [String], required: false }) missingNames?: string[];
}

export class ContentHealthSummaryDto {
  @ApiProperty() foods: number;
  @ApiProperty() categories: number;
  @ApiProperty() missingTranslations: number;
  @ApiProperty() missingDescriptions: number;
  @ApiProperty() missingImages: number;
  @ApiProperty() categoryTranslations: number;
}

export class ContentHealthDto {
  @ApiProperty({ type: [String] }) locales: string[];
  @ApiProperty({
    type: [FoodContentIssueDto],
    description: 'Only foods with at least one issue',
  })
  foods: FoodContentIssueDto[];
  @ApiProperty({
    type: [CategoryContentIssueDto],
    description: 'Only categories with at least one issue',
  })
  categories: CategoryContentIssueDto[];
  @ApiProperty({ type: ContentHealthSummaryDto })
  summary: ContentHealthSummaryDto;
}

export const FILL_ALL_TABS = ['translations', 'descriptions', 'categories'] as const;
export type FillAllTab = (typeof FILL_ALL_TABS)[number];

export class FillAllContentDto {
  @ApiProperty({ enum: FILL_ALL_TABS })
  @IsIn(FILL_ALL_TABS)
  tab: FillAllTab;
}

export class AiJobStatusDto {
  @ApiProperty() id: string;
  @ApiProperty({
    enum: ['pending', 'failed', 'done'],
    description: 'done also covers jobs that were never queued or have expired',
  })
  status: 'pending' | 'failed' | 'done';
}

export class AiBatchProgressDto {
  @ApiProperty() id: string;
  @ApiProperty() total: number;
  @ApiProperty() done: number;
  @ApiProperty() failed: number;
}

export class AiJobsDto {
  @ApiProperty({ type: AiBatchProgressDto, nullable: true })
  batch: AiBatchProgressDto | null;
  @ApiProperty({ type: [AiJobStatusDto] }) jobs: AiJobStatusDto[];
}

export class DescribeDishDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(255) name: string;
  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  category?: string | null;
  @ApiProperty({
    required: false,
    description: 'Stored image key or asset URL of the dish photo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageKey?: string;
  @ApiProperty({ required: false, example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  lang?: string;
}

export class DescribeDishResultDto {
  @ApiProperty({ nullable: true, type: String })
  description: string | null;
}
