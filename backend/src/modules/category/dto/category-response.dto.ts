import { ApiProperty } from '@nestjs/swagger';

export class CategoryItemDto {
  @ApiProperty() id: string;
  @ApiProperty() key: string;
  @ApiProperty({ nullable: true, type: String }) name: string | null;
  @ApiProperty({ nullable: true, type: String }) description: string | null;
  @ApiProperty() isAvailable: boolean;
}
