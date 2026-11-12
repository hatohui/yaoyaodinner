import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GlossaryTermDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true, type: String }) en: string | null;
  @ApiProperty({ nullable: true, type: String }) vi: string | null;
  @ApiProperty({ nullable: true, type: String }) zh: string | null;
  @ApiProperty({ nullable: true, type: String }) th: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'What the term means, for languages without an agreed word',
  })
  note: string | null;
}

export class SaveGlossaryTermDto {
  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  en?: string | null;

  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  vi?: string | null;

  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  zh?: string | null;

  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  th?: string | null;

  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
