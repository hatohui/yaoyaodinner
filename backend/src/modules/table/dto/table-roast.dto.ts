import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { SUPPORTED_LOCALES } from '@common/locales';

export class TableRoastDto {
  @ApiProperty() text: string;
  @ApiProperty() createdAt: string;
  @ApiProperty({
    description: 'People or orders changed since this roast was written',
  })
  isStale: boolean;
}

export class MemberRoastDto {
  @ApiProperty() personId: string;
  @ApiProperty({ nullable: true, type: String }) text: string | null;
  @ApiProperty({ nullable: true, type: String }) createdAt: string | null;
  @ApiProperty({ description: 'Name or picture changed since this roast' })
  isStale: boolean;
  @ApiProperty({ description: 'Roasts this person has left today' })
  remainingToday: number;
}

export class TableRoastStateDto {
  @ApiProperty({ type: TableRoastDto, nullable: true })
  table: TableRoastDto | null;
  @ApiProperty({ type: [MemberRoastDto] }) members: MemberRoastDto[];
}

export class RoastTableDto {
  @ApiProperty({ required: false, enum: SUPPORTED_LOCALES, example: 'en' })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  lang?: string;
}
