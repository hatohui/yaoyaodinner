import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import {
  CONFIG_DEFAULTS,
  serializeConfigValue,
} from '../src/common/config/registry';
import { generatePin } from '../src/common/pin';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.join(__dirname, 'data');

// ── Types ────────────────────────────────────────────────────────────────────

interface CategoryEntry {
  key: string;
}

interface CategoryTranslationEntry {
  name: string;
  description?: string;
}

interface CategoriesFile {
  categories: CategoryEntry[];
  translations: Record<string, CategoryTranslationEntry[]>;
}

interface FoodVariantTranslationEntry {
  label: string;
}

interface FoodVariantEntry {
  price?: number;
  currency?: string;
  isSeasonal?: boolean;
  translations?: Record<string, FoodVariantTranslationEntry>;
}

interface FoodTranslationEntry {
  name: string;
  description?: string;
}

interface FoodEntry {
  imageUrl?: string;
  variants?: FoodVariantEntry[];
  translations?: Record<string, FoodTranslationEntry>;
}

interface FoodFile {
  key: string;
  items: FoodEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function readFoodFiles(): FoodFile[] {
  const foodsDir = path.join(DATA_DIR, 'foods');
  return fs
    .readdirSync(foodsDir)
    .filter((f: string) => f.endsWith('.json'))
    .map((f: string) => readJson<FoodFile>(path.join(foodsDir, f)));
}

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seedLanguages() {
  const languages = [
    { code: 'en', name: 'English', direction: 'LTR' },
    { code: 'zh', name: '中文', direction: 'LTR' },
    { code: 'vi', name: 'Tiếng Việt', direction: 'LTR' },
    { code: 'th', name: 'ภาษาไทย', direction: 'LTR' },
    { code: 'ja', name: '日本語', direction: 'LTR' },
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
  }
  console.log(`✓ Languages (${languages.length})`);
}

async function seedConfig() {
  for (const c of CONFIG_DEFAULTS) {
    await prisma.appConfig.upsert({
      where: { key: c.key },
      update: {},
      create: {
        key: c.key,
        value: serializeConfigValue(c.type, c.value),
        type: c.type,
        category: c.category,
        label: c.label,
        isPublic: c.isPublic,
      },
    });
  }
  console.log(`✓ App config (${CONFIG_DEFAULTS.length} settings)`);
}

async function seedCategories(): Promise<Record<string, string>> {
  const { categories, translations }: CategoriesFile = readJson(
    path.join(DATA_DIR, 'categories.json'),
  );

  const categoryIds: Record<string, string> = {};

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];

    const existing = await prisma.category.findUnique({ where: { key: cat.key } });
    const id = existing?.id ?? uuidv4();

    await prisma.category.upsert({
      where: { key: cat.key },
      update: {},
      create: { id, key: cat.key },
    });

    categoryIds[cat.key] = id;

    for (const [lang, langTranslations] of Object.entries(translations)) {
      const t = langTranslations[i];
      if (!t) continue;
      await prisma.categoryTranslation.upsert({
        where: { categoryId_language: { categoryId: id, language: lang } },
        update: {},
        create: { categoryId: id, language: lang, name: t.name, description: t.description ?? null },
      });
    }
  }

  console.log(`✓ Categories (${categories.length}) with translations`);
  return categoryIds;
}

const SEED_EVENT_ID = 'seed-event';
const SEED_EVENT_PIN = '4821';

async function seedEvent() {
  await prisma.event.deleteMany({ where: { isActive: true } });
  await prisma.event.upsert({
    where: { id: SEED_EVENT_ID },
    update: { isActive: true, pin: SEED_EVENT_PIN },
    create: {
      id: SEED_EVENT_ID,
      pin: SEED_EVENT_PIN,
      name: "Tonight's dinner",
      isActive: true,
    },
  });
  console.log(`✓ Active event (PIN ${SEED_EVENT_PIN})`);
}

async function seedTables() {
  const tables: { name: string; capacity: number; x: number; y: number }[] =
    readJson(path.join(DATA_DIR, 'tables.json'));

  // Slots are the permanent floor plan; a Table is this event's seating at one.
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i];
    const no = i + 1;
    const slotId = `slot-${no}`;

    await prisma.tableSlot.upsert({
      where: { id: slotId },
      update: { no, name: t.name, defaultCapacity: t.capacity, x: t.x, y: t.y },
      create: {
        id: slotId,
        no,
        name: t.name,
        defaultCapacity: t.capacity,
        x: t.x,
        y: t.y,
      },
    });

    const id = `${SEED_EVENT_ID}-table-${no}`;
    await prisma.table.upsert({
      where: { id },
      update: { capacity: t.capacity, slotId, no },
      create: {
        id,
        slotId,
        no,
        capacity: t.capacity,
        eventId: SEED_EVENT_ID,
        code: generatePin(),
      },
    });
  }

  console.log(`✓ Table slots + tables (${tables.length})`);
}

async function seedFoods(categoryIds: Record<string, string>) {
  const foodFiles = readFoodFiles();
  let totalFoods = 0;
  let skipped = 0;

  for (const file of foodFiles) {
    const categoryId = categoryIds[file.key];
    if (!categoryId) {
      console.warn(`  ⚠ No category found for key "${file.key}", skipping`);
      continue;
    }

    for (const food of file.items) {

      const englishName = food.translations?.en?.name;
      if (englishName) {
        const existing = await prisma.foodTranslation.findFirst({
          where: { language: 'en', name: englishName },
          select: { foodId: true },
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      const foodId = uuidv4();

      await prisma.food.create({
        data: {
          id: foodId,
          imageUrl: food.imageUrl ?? null,
          categoryId,
          isAvailable: true,
          variants: food.variants
            ? {
              create: food.variants.map((v) => ({
                id: uuidv4(),
                price: v.price ?? null,
                currency: v.currency ?? 'RM',
                isSeasonal: v.isSeasonal ?? false,
                isAvailable: true,
                translations: v.translations
                  ? {
                    create: Object.entries(v.translations)
                      .filter(([, t]) => t.label)
                      .map(([lang, t]) => ({
                        language: lang,
                        label: t.label,
                      })),
                  }
                  : undefined,
              })),
            }
            : undefined,
          translations: food.translations
            ? {
              create: Object.entries(food.translations).map(([lang, t]) => ({
                language: lang,
                name: t.name,
                description: t.description ?? null,
              })),
            }
            : undefined,
        },
      });

      totalFoods++;
    }
  }

  console.log(
    `✓ Foods (${totalFoods} new across ${foodFiles.length} categories${skipped > 0 ? `, ${skipped} already present` : ''
    })`,
  );
}

const SAMPLE_NAMES = [
  'Wei Ling', 'Aaron', 'Siti', 'Kai', 'Mei Xin', 'Daniel', 'Priya', 'Hakim',
  'Jia Hui', 'Farah', 'Ryan', 'Nadia', 'Chee Keong', 'Amira', 'Josh', 'Yun Er',
  'Rahul', 'Bao Zhen', 'Lina', 'Marcus',
];

const SAMPLE_NOTES = [
  "can't eat shrimp",
  'no peanuts please',
  'vegetarian tonight',
  'extra spicy for me',
];

const SAMPLE_FEEDBACK = [
  { by: 'Wei Ling', content: 'the la-la was unreal, please make it again' },
  { by: 'Aaron', content: 'whoever ordered 3 plates of omelette - respect' },
  { by: null, content: 'table 4 had the best seats, no notes' },
  { by: 'Priya', content: 'came for the food, stayed for the arguing over splits' },
  { by: 'Kai', content: 'the yam basket disappeared in 90 seconds' },
];

/** Seats people across the first several tables and marks a couple of hosts. */
async function seedPeople() {
  const tables = await prisma.table.findMany({
    where: { eventId: SEED_EVENT_ID },
    orderBy: { slot: { no: 'asc' } },
    select: { id: true, capacity: true },
  });
  if (tables.length === 0) return [];

  const created: { id: string; tableId: string }[] = [];
  let cursor = 0;

  for (let i = 0; i < Math.min(tables.length, 8); i++) {
    const table = tables[i];
    const seats = Math.min(table.capacity, 2 + (i % 3));

    for (let s = 0; s < seats; s++) {
      const name = SAMPLE_NAMES[cursor % SAMPLE_NAMES.length];
      cursor++;
      const id = `${SEED_EVENT_ID}-person-${cursor}`;
      await prisma.people.upsert({
        where: { id },
        update: { name, tableId: table.id, eventId: SEED_EVENT_ID },
        create: { id, name, tableId: table.id, eventId: SEED_EVENT_ID },
      });
      created.push({ id, tableId: table.id });
    }

    // every other table gets a host, so the badge/filter have something to show
    if (i % 2 === 0) {
      const first = created.find((p) => p.tableId === table.id);
      if (first) {
        await prisma.table.update({
          where: { id: table.id },
          data: { tableLeaderId: first.id },
        });
      }
    }
  }

  console.log(`✓ People (${created.length})`);
  return created;
}

async function seedNotes(people: { id: string }[]) {
  for (let i = 0; i < Math.min(SAMPLE_NOTES.length, people.length); i++) {
    const id = `${SEED_EVENT_ID}-note-${i + 1}`;
    await prisma.personalNote.upsert({
      where: { id },
      update: { content: SAMPLE_NOTES[i], personId: people[i].id },
      create: { id, content: SAMPLE_NOTES[i], personId: people[i].id },
    });
  }
  console.log(`✓ Personal notes (${Math.min(SAMPLE_NOTES.length, people.length)})`);
}

/** Mixes whole-table orders with subset splits so cost-splitting views have data. */
async function seedOrders(people: { id: string; tableId: string }[]) {
  const variants = await prisma.foodVariant.findMany({
    where: { isAvailable: true, price: { not: null } },
    select: { id: true, price: true },
    take: 40,
  });
  if (variants.length === 0) return;

  const tableIds = [...new Set(people.map((p) => p.tableId))];
  let n = 0;

  for (let i = 0; i < tableIds.length; i++) {
    const tableId = tableIds[i];
    const seated = people.filter((p) => p.tableId === tableId);

    for (let j = 0; j < 3; j++) {
      const variant = variants[(i * 3 + j) % variants.length];
      n++;
      const id = `${SEED_EVENT_ID}-order-${n}`;
      const splitAll = j !== 2;

      await prisma.order.upsert({
        where: { id },
        update: {},
        create: {
          id,
          tableId,
          variantId: variant.id,
          eventId: SEED_EVENT_ID,
          quantity: 1 + (j % 3),
          price: variant.price ?? 0,
          splitAll,
        },
      });

      // the non-shared one is split across a subset of the table
      if (!splitAll && seated.length > 0) {
        const subset = seated.slice(0, Math.max(1, Math.ceil(seated.length / 2)));
        for (const person of subset) {
          await prisma.orderSplit.upsert({
            where: { orderId_personId: { orderId: id, personId: person.id } },
            update: {},
            create: { orderId: id, personId: person.id },
          });
        }
      }
    }
  }

  console.log(`✓ Orders (${n})`);
}

async function seedFeedback() {
  for (let i = 0; i < SAMPLE_FEEDBACK.length; i++) {
    const entry = SAMPLE_FEEDBACK[i];
    const id = `${SEED_EVENT_ID}-feedback-${i + 1}`;
    await prisma.feedback.upsert({
      where: { id },
      update: { by: entry.by, content: entry.content },
      create: { id, by: entry.by, content: entry.content, eventId: SEED_EVENT_ID },
    });

    for (const [emoji, count] of [
      ['👍', 3 - (i % 3)],
      ['🔥', (i * 2) % 5],
    ] as const) {
      if (count <= 0) continue;
      await prisma.feedbackReaction.upsert({
        where: { feedbackId_emoji: { feedbackId: id, emoji } },
        update: { count },
        create: { feedbackId: id, emoji, count },
      });
    }
  }
  console.log(`✓ Feedback (${SAMPLE_FEEDBACK.length})`);
}

const GLOSSARY_TERMS = [
  { id: 'f93aa21f-f8dd-4f19-90fb-51c0ae1466f3', en: 'Assam', vi: 'sốt me', zh: '亚参', th: 'มะขาม', ja: 'アサム', note: "Tamarind: a sour, tangy gravy (Malay 'asam'). Not ginseng and not the Indian region." },
  { id: 'f1a93068-e08d-4975-9fb3-d1eb95816980', en: 'Belacan', vi: null, zh: '马拉盏', th: 'กะปิ', ja: 'ブラチャン', note: 'Fermented shrimp paste' },
  { id: 'd4724589-843e-4fc8-bc1e-24bbfc7ffde2', en: 'Char Siew', vi: 'xá xíu', zh: '叉烧', th: 'หมูแดง', ja: 'チャーシュー', note: 'Chinese barbecued pork' },
  { id: '97a0c873-918b-41d5-8f6e-8e7bae7e7f91', en: 'Cincau', vi: 'sương sáo', zh: '凉粉', th: 'เฉาก๊วย', ja: '仙草ゼリー', note: 'Grass jelly' },
  { id: 'a10887ff-bb16-4d6e-8dbe-d9c4d1b1b07b', en: 'Dace', vi: null, zh: '鲮鱼', th: null, ja: 'ケンヒー', note: 'Canned fried dace fish, usually with fermented black beans' },
  { id: 'efece4b6-8308-4e0a-b0e2-9b28b0a98582', en: 'Garoupa', vi: 'cá mú', zh: '石斑', th: 'ปลาเก๋า', ja: 'ハタ', note: 'Grouper fish' },
  { id: 'fc388b85-aa60-49ab-9ab5-acdfc349a2ec', en: 'Gong-Bo', vi: null, zh: '宫保', th: null, ja: '宮保', note: 'Kung Pao: stir-fried with dried chillies and peanuts' },
  { id: '2de4dc24-9379-473e-afc3-07d1e7caebe1', en: 'Kai Lan', vi: 'cải làn', zh: '芥兰', th: 'คะน้า', ja: 'カイラン', note: 'Chinese kale' },
  { id: 'ed65bc88-d375-45e1-a11f-805753aead64', en: 'Kam Heong', vi: null, zh: '金香', th: null, ja: 'カムヒョン', note: 'Fragrant dry stir-fry with curry leaves, dried shrimp and chilli' },
  { id: '24daaec2-aff9-4e1e-b27b-1265c3631756', en: 'Kangkong', vi: 'rau muống', zh: '蕹菜', th: 'ผักบุ้ง', ja: '空心菜', note: 'Water spinach' },
  { id: 'c3086ccb-8248-402b-97e7-2ce7827aa9f4', en: 'La-La', vi: 'nghêu', zh: '啦啦', th: null, ja: 'アサリ', note: "Clams (Malaysian 'lala')" },
  { id: 'c609976f-b6e1-4528-b71a-fbe9358bd3e6', en: 'Lady Finger', vi: 'đậu bắp', zh: '秋葵', th: 'กระเจี๊ยบเขียว', ja: 'オクラ', note: 'Okra' },
  { id: '70199e88-84fc-4fd5-bf28-5dec6e99b4b1', en: 'Marmite', vi: null, zh: '妈蜜', th: null, ja: 'マーマイト', note: 'Sweet and savoury glaze made with Marmite yeast extract and honey' },
  { id: '198bc5a8-8206-40a7-9be5-0ce3bdee95dd', en: 'Nam Yu', vi: null, zh: '南乳', th: null, ja: '南乳', note: 'Red fermented bean curd' },
  { id: 'adfee7f7-e91f-4f7d-a6c2-6a8da808828d', en: 'Pandan', vi: 'lá dứa', zh: '班兰', th: 'ใบเตย', ja: 'パンダン', note: 'Pandan leaf' },
  { id: '6913a877-93e8-4e92-abea-d90149a4f015', en: 'Petai', vi: null, zh: '臭豆', th: 'สะตอ', ja: 'ペタイ', note: 'Stink bean (bitter bean)' },
  { id: '4f59849f-60d1-46c2-a7cd-596adcbc4f7b', en: 'Rendang', vi: null, zh: '冷当', th: null, ja: 'ルンダン', note: 'Slow-cooked dry curry with coconut and spices' },
  { id: '480f55dd-f15e-40a7-9985-343968a0c176', en: 'Salted Egg', vi: 'trứng muối', zh: '咸蛋', th: 'ไข่เค็ม', ja: '塩卵', note: 'Salted duck egg yolk sauce' },
  { id: 'f0e33dce-fce3-487d-88be-d5a569f8ee72', en: 'Sambal', vi: null, zh: '参巴', th: null, ja: 'サンバル', note: 'Malaysian chilli paste' },
  { id: '3d68fe2a-837c-484a-b9c8-e39aadc79134', en: 'Seng Gua', vi: 'mướp', zh: '胜瓜', th: 'บวบ', ja: 'ヘチマ', note: 'Luffa gourd' },
  { id: '5ec2b1a0-bb37-41ce-bb64-741965a09c58', en: 'Shao Hsing', vi: null, zh: '花雕', th: null, ja: '紹興酒', note: 'Shaoxing Chinese rice wine' },
  { id: '809f2b6a-79ad-49fd-ae76-d3f0b720a7ab', en: 'Threadfin', vi: 'cá chét', zh: '马友', th: 'ปลากุเลา', ja: 'ツバメコノシロ', note: 'Threadfin fish' },
  { id: 'a685d4de-e57b-4154-a738-1e8a8c9d35ec', en: 'Village Chicken', vi: 'gà ta', zh: '菜园鸡', th: 'ไก่บ้าน', ja: '地鶏', note: 'Free-range local chicken' },
  { id: '8c1f84db-03d0-4762-8a9a-8a7f2f0902a3', en: 'Yu Sheng', vi: null, zh: '鱼生', th: null, ja: 'ユーシェン', note: 'Chinese New Year raw fish salad tossed for good fortune' },
];

async function seedGlossary() {
  for (const term of GLOSSARY_TERMS) {
    await prisma.glossaryTerm.upsert({
      where: { id: term.id },
      update: { ja: term.ja, note: term.note },
      create: term,
    });
  }
  console.log(`✓ Glossary (${GLOSSARY_TERMS.length})`);
}

async function main() {
  const withSampleData = process.argv.includes('--with-sample-data');

  console.log('🌱 Seeding core data...\n');
  await seedLanguages();
  await seedConfig();
  await seedGlossary();
  const categoryIds = await seedCategories();
  await seedFoods(categoryIds);

  if (withSampleData) {
    console.log('\n🧪 Seeding sample data...\n');
    await seedEvent();
    await seedTables();
    const people = await seedPeople();
    await seedNotes(people);
    await seedOrders(people);
    await seedFeedback();
  }

  console.log(
    `\n✅ Seed complete!${withSampleData ? '' : ' (core only - pass --with-sample-data for demo content)'}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
