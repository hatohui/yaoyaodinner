import { ApiProperty } from '@nestjs/swagger';

export class SignUrlResponseDto {
  @ApiProperty() url: string;
  @ApiProperty() key: string;
  @ApiProperty() thumbUrl: string;
  @ApiProperty() thumbKey: string;
}
