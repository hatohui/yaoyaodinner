import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedbackReactionDto {
  @ApiProperty() emoji: string;
  @ApiProperty() count: number;
}

export class FeedbackAuthorDto {
  @ApiProperty() personId: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) pfpUrl: string | null;
  @ApiProperty({ nullable: true, type: String }) note: string | null;
  @ApiProperty({ nullable: true, type: String }) tableId: string | null;
  @ApiProperty({ nullable: true, type: Number }) tableNo: number | null;
  @ApiProperty({ nullable: true, type: String }) tableName: string | null;
}

export class FeedbackItemDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true, type: String }) by: string | null;
  @ApiProperty({ nullable: true, type: String }) content: string | null;
  @ApiProperty({ nullable: true, type: String }) imageUrl: string | null;
  @ApiProperty({ nullable: true, type: String }) eventId: string | null;
  @ApiProperty({ type: [FeedbackReactionDto] }) reactions: FeedbackReactionDto[];
  @ApiProperty() reactionTotal: number;
  @ApiPropertyOptional({
    nullable: true,
    type: FeedbackAuthorDto,
    description: 'The person at the event whose name matches "by", if exactly one does',
  })
  author?: FeedbackAuthorDto | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class GetFeedbackResponseDto {
  @ApiProperty({ type: [FeedbackItemDto] }) feedback: FeedbackItemDto[];
  @ApiProperty() total: number;
}
