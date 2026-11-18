import { clearGlossaryCache } from "./glossary";
import {
  describeDish,
  draftFood,
  fillCategory,
  fillFood,
  fillFoods,
  inventDish,
  saveFoodContent,
  translatePresetNote,
} from "./menu";
import { planTable } from "./plan";
import { roastPerson, roastTable, translateRoasts } from "./roast";

export type {
  DraftMode,
  DraftOptions,
  FillResult,
  FoodContent,
  FoodDraft,
  InventedDish,
} from "./menu";
export type { EarlierRoast, PersonRoastInput, TableRoastInput } from "./roast";
export {
  PER_PERSON_COURSES,
  PLAN_COURSES,
  type PlanCourse,
  type PlanMenuItem,
  type PlanRestriction,
  type TablePlanInput,
  type TablePlanResult,
} from "./plan";

export const AiService = {
  planTable,
  clearGlossaryCache,
  draftFood,
  saveFoodContent,
  fillFood,
  fillFoods,
  fillCategory,
  describeDish,
  inventDish,
  roastTable,
  translateRoasts,
  roastPerson,
  translatePresetNote,
};
