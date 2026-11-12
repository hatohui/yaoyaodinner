import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./modules/health/health.module";
import { LanguageModule } from "./modules/language/language.module";
import { CategoryModule } from "./modules/category/category.module";
import { FoodModule } from "./modules/food/food.module";
import { TableModule } from "./modules/table/table.module";
import { PeopleModule } from "./modules/people/people.module";
import { EventModule } from "./modules/event/event.module";
import { AuthModule } from "./auth/auth.module";
import { OrderModule } from "./modules/order/order.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { PersonalNoteModule } from "./modules/personal-note/personal-note.module";
import { PresetMenuModule } from "./modules/preset-menu/preset-menu.module";
import { SeasonalPriceModule } from "./modules/seasonal-price/seasonal-price.module";
import { StatsModule } from "./modules/stats/stats.module";
import { ImagesModule } from "./modules/images/images.module";
import { ImageUploadModule } from "./modules/images/image-upload.module";
import { ScheduledModule } from "./modules/scheduled/scheduled.module";
import { ConfigModule as AppConfigModule } from "./modules/config/config.module";
import { ContentHealthModule } from "./modules/content-health/content-health.module";
import { AiJobsModule } from "./modules/ai-jobs/ai-jobs.module";
import { WorkerModule } from "./modules/worker/worker.module";
import { GlossaryModule } from "./modules/glossary/glossary.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppConfigModule,
    HealthModule,
    LanguageModule,
    CategoryModule,
    FoodModule,
    TableModule,
    PeopleModule,
    EventModule,
    AuthModule,
    OrderModule,
    FeedbackModule,
    PersonalNoteModule,
    PresetMenuModule,
    SeasonalPriceModule,
    StatsModule,
    ImagesModule,
    ImageUploadModule,
    ScheduledModule,
    AiJobsModule,
    WorkerModule,
    ContentHealthModule,
    GlossaryModule,
  ],
})
export class AppModule {}
