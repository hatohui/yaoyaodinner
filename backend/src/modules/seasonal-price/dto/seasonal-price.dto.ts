import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min, ValidateIf } from 'class-validator';

export class SeasonalPriceDto {
  @ApiProperty() variantId: string;
  @ApiProperty() foodId: string;
  @ApiProperty() foodName: string;
  @ApiProperty({ nullable: true, type: String }) imageUrl: string | null;
  @ApiProperty() variantLabel: string;
  @ApiProperty() currency: string;
  @ApiProperty({ description: 'Quantity ordered at this event' })
  orderedCount: number;
  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Price at this event; null until the admin sets one',
  })
  price: number | null;
}

export class SetSeasonalPriceDto {
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  price: number | null;
}
