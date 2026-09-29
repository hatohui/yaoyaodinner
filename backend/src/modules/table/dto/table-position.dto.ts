import { IsNumber, Max, Min, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Percent of the floor-plan canvas (0-100); null on both takes it off the map. */
export class TablePositionDto {
  @ApiProperty({ example: 42.5, nullable: true, type: Number })
  @ValidateIf((dto: TablePositionDto) => dto.x !== null || dto.y !== null)
  @IsNumber()
  @Min(0)
  @Max(100)
  x: number | null;

  @ApiProperty({ example: 60, nullable: true, type: Number })
  @ValidateIf((dto: TablePositionDto) => dto.x !== null || dto.y !== null)
  @IsNumber()
  @Min(0)
  @Max(100)
  y: number | null;
}
