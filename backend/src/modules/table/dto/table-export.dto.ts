import { ApiProperty } from '@nestjs/swagger';

export class TableExportFoodDto {
  @ApiProperty() variantId: string;
  @ApiProperty({ enum: ['pre', 'dinner'], enumName: 'OrderRound' })
  round: 'pre' | 'dinner';
  @ApiProperty() foodName: string;
  @ApiProperty() variantLabel: string;
  @ApiProperty() quantity: number;
}

export class TableExportDto {
  @ApiProperty() id: string;
  @ApiProperty() no: number;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) hostName: string | null;
  @ApiProperty({ type: [String] }) people: string[];
  @ApiProperty({ type: [TableExportFoodDto] }) foods: TableExportFoodDto[];
}
