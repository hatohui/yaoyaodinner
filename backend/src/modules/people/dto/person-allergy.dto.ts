import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const ALLERGENS = [
  'shellfish',
  'fish',
  'peanut',
  'tree_nut',
  'dairy',
  'egg',
  'gluten',
  'soy',
  'sesame',
  'pork',
  'beef',
  'alcohol',
  'vegetarian',
  'other',
] as const;

export type Allergen = (typeof ALLERGENS)[number];

export class PersonAllergyDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ALLERGENS, enumName: 'Allergen' })
  allergen: Allergen;
  @ApiPropertyOptional({ nullable: true, type: String })
  label: string | null;
}

export class AllergyInputDto {
  @ApiProperty({ enum: ALLERGENS, enumName: 'Allergen' })
  @IsIn(ALLERGENS)
  allergen: Allergen;

  @ApiPropertyOptional({ maxLength: 100, description: 'Required for "other"' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}

export class SetAllergiesDto {
  @ApiProperty({ type: [AllergyInputDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AllergyInputDto)
  allergies: AllergyInputDto[];
}
