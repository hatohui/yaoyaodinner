import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const WISH_KINDS = ['must', 'want', 'avoid'] as const;
export type WishKind = (typeof WISH_KINDS)[number];

export class TableWishDto {
  @ApiProperty() id: string;
  @ApiProperty() tableId: string;
  @ApiProperty({ enum: WISH_KINDS, enumName: 'WishKind' }) kind: WishKind;
  @ApiPropertyOptional({ nullable: true, type: String }) variantId: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) foodId: string | null;
  @ApiProperty({ description: 'Menu dish name, or the free-text label' })
  name: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  variantLabel: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  foodImageUrl: string | null;
  @ApiPropertyOptional({ nullable: true, type: Number })
  price: number | null;
  @ApiProperty() currency: string;
  @ApiProperty() shouldCalculate: boolean;
  @ApiProperty({
    type: [String],
    description: 'Who the dish is for; empty means the whole table',
  })
  personIds: string[];
  @ApiProperty() createdAt: Date;
}

export class CreateTableWishDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tableId: string;

  @ApiProperty({ enum: WISH_KINDS, enumName: 'WishKind' })
  @IsIn(WISH_KINDS)
  kind: WishKind;

  @ApiPropertyOptional({ description: 'A menu dish; omit to use label' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ maxLength: 120, description: 'A dish not on the menu' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}

export class UpdateTableWishDto {
  @ApiPropertyOptional({ enum: WISH_KINDS, enumName: 'WishKind' })
  @IsOptional()
  @IsIn(WISH_KINDS)
  kind?: WishKind;

  @ApiPropertyOptional({ description: 'Another option of the same dish' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Who the dish is for; empty means the whole table',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  personIds?: string[];
}
