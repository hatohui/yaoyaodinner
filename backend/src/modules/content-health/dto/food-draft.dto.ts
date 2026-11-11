import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SUPPORTED_LOCALES } from '@common/locales';

export class VariantLabelDto {
  @ApiProperty() @IsString() @MaxLength(255) id: string;
  @ApiProperty() @IsString() @MaxLength(255) label: string;
}

export class FoodContentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ type: [VariantLabelDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => VariantLabelDto)
  variants?: VariantLabelDto[];
}

export class FoodDraftLocaleDto {
  @ApiProperty() lang: string;
  @ApiProperty({ type: FoodContentDto, description: 'What is saved now' })
  current: FoodContentDto;
  @ApiProperty({
    type: FoodContentDto,
    description: 'Only the fields AI would write',
  })
  draft: FoodContentDto;
}

export class FoodDraftDto {
  @ApiProperty() sourceLang: string;
  @ApiProperty({ type: [VariantLabelDto], description: 'Variant labels in the source language' })
  variants: VariantLabelDto[];
  @ApiProperty({ type: [FoodDraftLocaleDto] }) locales: FoodDraftLocaleDto[];
}

export class DraftFoodContentDto {
  @ApiProperty({
    required: false,
    description: 'Also write a description when the food has none in any locale',
  })
  @IsOptional()
  @IsBoolean()
  describe?: boolean;

  @ApiProperty({
    required: false,
    description: 'Ask for a different draft than last time',
  })
  @IsOptional()
  @IsBoolean()
  regenerate?: boolean;
}

export class SaveFoodLocaleDto extends FoodContentDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES })
  @IsIn(SUPPORTED_LOCALES)
  lang: string;

  @ApiProperty({ description: 'False once staff edited the AI text' })
  @IsBoolean()
  isAiGenerated: boolean;
}

export class SaveFoodContentDto {
  @ApiProperty({ type: [SaveFoodLocaleDto] })
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => SaveFoodLocaleDto)
  locales: SaveFoodLocaleDto[];
}

export class SaveFoodContentResultDto {
  @ApiProperty({ description: 'Translation rows written' }) updated: number;
}
