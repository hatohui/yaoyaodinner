import { ApiProperty } from '@nestjs/swagger';

export class PresetMenuItemDto {
  @ApiProperty() variantId: string;
  @ApiProperty() foodId: string;
  @ApiProperty() foodName: string;
  @ApiProperty({ nullable: true, type: String }) imageUrl: string | null;
  @ApiProperty() variantLabel: string;
  @ApiProperty({ nullable: true, type: Number }) price: number | null;
  @ApiProperty() currency: string;
  @ApiProperty() quantity: number;
}

export class PresetMenuDto {
  @ApiProperty() id: string;
  @ApiProperty() price: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: [PresetMenuItemDto] }) items: PresetMenuItemDto[];
}
