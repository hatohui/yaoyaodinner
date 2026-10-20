import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TableCodeDto {
  @ApiProperty({ example: '4821' })
  @IsString()
  code: string;
}

export class TableCodeVerifyResponseDto {
  @ApiProperty() valid: boolean;
}

export class TableCodeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
}
