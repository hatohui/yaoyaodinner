import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PLAN_COURSES, type PlanCourse } from '@libs/ai';
import { SUPPORTED_LOCALES } from '@common/locales';

export const TABLE_PLAN_STATUSES = ['idle', 'pending', 'done', 'failed'] as const;
export type TablePlanStatus = (typeof TABLE_PLAN_STATUSES)[number];

export class TablePlanItemDto {
  @ApiProperty({ enum: PLAN_COURSES, description: 'Which part of the dinner it covers' })
  course: PlanCourse;
  @ApiProperty() foodId: string;
  @ApiProperty() variantId: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String, description: 'Portion label, like 6 pcs' })
  label: string | null;
  @ApiProperty({ nullable: true, type: String }) imageUrl: string | null;
  @ApiProperty({ nullable: true, type: Number, description: 'Null when the price is not set yet' })
  price: number | null;
  @ApiProperty() currency: string;
  @ApiProperty({ description: 'False for joke dishes that are not billed' })
  shouldCalculate: boolean;
  @ApiProperty() quantity: number;
  @ApiProperty() reason: string;
}

export class TablePlanRestrictionDto {
  @ApiProperty() id: string;
  @ApiProperty() guest: string;
  @ApiProperty({ description: 'The restriction, in the requested language' })
  label: string;
  @ApiProperty({
    description: 'False when the note only hints at it, so the table should confirm it',
  })
  certain: boolean;
}

export class PlanBaselineItemDto {
  @ApiProperty() variantId: string;
  @ApiProperty() quantity: number;
}

export class TablePlanDto {
  @ApiProperty() title: string;
  @ApiProperty() intro: string;
  @ApiProperty({
    type: [TablePlanRestrictionDto],
    description: 'Food restrictions found in guest notes; every one is kept out of the plan',
  })
  restrictions: TablePlanRestrictionDto[];
  @ApiProperty({ type: [TablePlanItemDto] }) items: TablePlanItemDto[];
  @ApiProperty({ description: 'How many people the plan feeds' }) headcount: number;
  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Extra spend per person on top of the set menu, if the table set one',
  })
  budgetPerPerson: number | null;
  @ApiProperty({ description: 'Sum of known prices; seasonal dishes without a price are left out' })
  estimatedTotal: number;
  @ApiProperty({ nullable: true, type: String, description: 'What the table said they are in the mood for' })
  preference: string | null;
  @ApiProperty({ description: 'False when the table asked for no alcohol' })
  alcohol: boolean;
  @ApiProperty({
    enum: ['plan', 'modify'],
    description: 'plan is a fresh order; modify is the whole order after the AI edited what the table already ordered',
  })
  mode: 'plan' | 'modify';
  @ApiProperty({
    type: [PlanBaselineItemDto],
    description:
      'What the table had ordered when a modify suggestion was made; applying it only changes these by the amounts shown',
  })
  baseline: PlanBaselineItemDto[];
  @ApiProperty() createdAt: string;
  @ApiProperty({ description: 'Guests or orders changed since this plan was made' })
  isStale: boolean;
}

export class TablePlanStateDto {
  @ApiProperty({ enum: TABLE_PLAN_STATUSES }) status: TablePlanStatus;
  @ApiProperty({ type: TablePlanDto, nullable: true }) plan: TablePlanDto | null;
  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Tables waiting ahead of this one while pending',
  })
  position: number | null;
}

export class PlanDraftItemDto {
  @ApiProperty() @IsString() variantId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(40) quantity: number;
}

export class PlanTableDto {
  @ApiProperty({ required: false, enum: SUPPORTED_LOCALES, example: 'en' })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  lang?: string;

  @ApiProperty({ required: false, description: 'People eating; defaults to who is seated' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  headcount?: number;

  @ApiProperty({
    required: false,
    description: 'Extra spend per person on top of the set menu; leave out for no limit',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  budgetPerPerson?: number;

  @ApiProperty({
    required: false,
    description: 'What the table is in the mood for, in their own words',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  preference?: string;

  @ApiProperty({ required: false, description: 'False to keep alcohol off the plan; defaults to true' })
  @IsOptional()
  @IsBoolean()
  alcohol?: boolean;

  @ApiProperty({
    required: false,
    description: 'Edit what the table already ordered, as note asks, instead of planning from scratch',
  })
  @IsOptional()
  @IsBoolean()
  modify?: boolean;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Ids of unsure restrictions the table says are not real; needs table access',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dismiss?: string[];

  @ApiProperty({
    required: false,
    description: 'What the table wants changed, in their own words; reworks the current plan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @ApiProperty({
    required: false,
    type: [PlanDraftItemDto],
    description: 'The plan as the table edited it, to rework instead of starting over',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => PlanDraftItemDto)
  current?: PlanDraftItemDto[];
}
