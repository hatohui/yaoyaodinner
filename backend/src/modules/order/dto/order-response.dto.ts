import { ApiProperty } from '@nestjs/swagger';

export class OrderSplitDto {
  @ApiProperty() personId: string;
}

export class OrderResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tableId: string;
  @ApiProperty() variantId: string;
  @ApiProperty() foodId: string;
  @ApiProperty({ nullable: true, type: String }) eventId: string | null;
  @ApiProperty() quantity: number;
  @ApiProperty() price: number;
  @ApiProperty() currency: string;
  @ApiProperty() splitAll: boolean;
  @ApiProperty() foodName: string;
  @ApiProperty() variantLabel: string;
  @ApiProperty({ nullable: true, type: String }) foodImageUrl: string | null;
  @ApiProperty({
    description:
      'Whether this order counts toward table/split totals. False for joke/gag menu items.',
  })
  shouldCalculate: boolean;
  @ApiProperty({ type: [OrderSplitDto] }) splits: OrderSplitDto[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
