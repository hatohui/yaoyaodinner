import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class AppConfigDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;

  @ApiProperty({ enum: ["string", "number", "boolean", "json"] })
  type: string;

  @ApiProperty({ nullable: true, type: String })
  category: string | null;

  @ApiProperty({ nullable: true, type: String })
  label: string | null;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  updatedAt: string;
}

export class UpdateConfigDto {
  @ApiProperty({ description: "Raw value, stored as-is and parsed by the row's type" })
  @IsString()
  value: string;
}
