import { ApiProperty } from '@nestjs/swagger';

export class FeedbackReactionDto {
  @ApiProperty() emoji: string;
  @ApiProperty() count: number;
}

export class FeedbackItemDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true, type: String }) by: string | null;
  @ApiProperty({ nullable: true, type: String }) content: string | null;
  @ApiProperty({ nullable: true, type: String }) imageUrl: string | null;
  @ApiProperty({ nullable: true, type: String }) eventId: string | null;
  @ApiProperty({ type: [FeedbackReactionDto] }) reactions: FeedbackReactionDto[];
  @ApiProperty() reactionTotal: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class GetFeedbackResponseDto {
  @ApiProperty({ type: [FeedbackItemDto] }) feedback: FeedbackItemDto[];
  @ApiProperty() total: number;
}
