import { ApiProperty } from '@nestjs/swagger';

export class FoodItemDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) imageUrl: string | null;
  @ApiProperty({ nullable: true, type: String }) description: string | null;
  @ApiProperty({ nullable: true, type: String }) categoryId: string | null;
  @ApiProperty() isAvailable: boolean;
  @ApiProperty() isPopular: boolean;
  @ApiProperty({
    description:
      'Staff pick: admins flag this food as recommended so the menu shows a recommended tag.',
  })
  isRecommended: boolean;
  @ApiProperty({ nullable: true, type: String }) defaultVariantId: string | null;
  @ApiProperty({ nullable: true, type: Number }) price: number | null;
  @ApiProperty({ nullable: true, type: String }) currency: string | null;
  @ApiProperty({
    description:
      'Whether orders of this food count toward table/split totals. False for joke/gag menu items that still show a price and can be ordered, but are free.',
  })
  shouldCalculate: boolean;
  @ApiProperty({ required: false }) aiTranslationFailed?: boolean;
}

export class GetFoodsResponseDto {
  @ApiProperty({ type: [FoodItemDto] }) foods: FoodItemDto[];
  @ApiProperty() page: number;
  @ApiProperty() count: number;
  @ApiProperty() total: number;
}

export class FoodVariantDto {
  @ApiProperty() id: string;
  @ApiProperty() label: string;
  @ApiProperty({ nullable: true, type: Number }) price: number | null;
  @ApiProperty() currency: string;
  @ApiProperty() isSeasonal: boolean;
  @ApiProperty() isAvailable: boolean;
  @ApiProperty({ required: false }) aiTranslationFailed?: boolean;
}

export class FoodDetailDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) imageUrl: string | null;
  @ApiProperty({ nullable: true, type: String }) description: string | null;
  @ApiProperty({ nullable: true, type: String }) categoryId: string | null;
  @ApiProperty() isAvailable: boolean;
  @ApiProperty({
    description:
      'Whether orders of this food count toward table/split totals. False for joke/gag menu items that still show a price and can be ordered, but are free.',
  })
  shouldCalculate: boolean;
  @ApiProperty() isPopular: boolean;
  @ApiProperty({
    description:
      'Staff pick: admins flag this food as recommended so the menu shows a recommended tag.',
  })
  isRecommended: boolean;
  @ApiProperty({ type: [FoodVariantDto] }) variants: FoodVariantDto[];
  @ApiProperty({ required: false }) aiTranslationFailed?: boolean;
}

export class GetFoodsForAdminResponseDto {
  @ApiProperty({ type: [FoodDetailDto] }) foods: FoodDetailDto[];
  @ApiProperty() page: number;
  @ApiProperty() count: number;
  @ApiProperty() total: number;
}
