import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteResponseDto } from '../../personal-note/dto/note-response.dto';

export class PersonDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  tableId: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  eventId: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  pfpUrl: string | null;
  @ApiPropertyOptional({ type: [NoteResponseDto] })
  personalNotes?: NoteResponseDto[];
}
