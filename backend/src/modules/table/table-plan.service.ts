import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '@libs/prisma';
import {
  AiService,
  PER_PERSON_COURSES,
  type PlanCourse,
  type PlanMenuItem,
  type PlanRestriction,
} from '@libs/ai';
import { CacheService } from '@libs/redis';
import { SUPPORTED_LOCALES } from '@common/locales';
import { WorkerService } from '@modules/worker/worker.service';
import { EventService } from '@modules/event/event.service';
import type { TablePlanDto, TablePlanItemDto, TablePlanStateDto } from './dto/table-plan.dto';

const PLAN_TTL = 3 * 24 * 60 * 60;
const QUEUE_TTL = 60 * 60;
const COOLDOWN_SECONDS = 15;
const PENDING_TIMEOUT_MS = 4 * 60_000;
/** Longer than the Lambda timeout, so a worker that dies frees the lock on its own. */
const WORKER_LOCK_TTL = 150;
const WORKER_BUDGET_MS = 75_000;
const WORKER_CONCURRENCY = 3;
const MIN_REQUEST_GAP_MS = 1_500;
const MAX_DESCRIPTION = 140;
/** A plan may run this far over the budget before dishes are trimmed. */
const BUDGET_SLACK = 1.1;
const TRIM_ORDER: PlanCourse[] = ['dessert', 'snack', 'main', 'vegetable'];
const MIN_MAINS = 2;

const QUEUE_KEY = 'plan:queue';
const WORKER_KEY = 'plan:worker';
const TICKET_KEY = 'plan:ticket';
const SERVED_KEY = 'plan:served';

export type PlanOptions = {
  headcount: number | null;
  budgetPerPerson: number | null;
  preference: string | null;
  alcohol: boolean;
  /** Set when the table asked the AI to change what they already ordered. */
  modify: { note: string } | null;
};
export type PlanRework = { note: string | null; current: { variantId: string; quantity: number }[] };
type QueuedPlan = {
  tableId: string;
  lang: string;
  ticket: number;
  options: PlanOptions;
  rework: PlanRework | null;
};

type StoredRestriction = PlanRestriction & { id: string };
type StoredPlan = Omit<TablePlanDto, 'isStale' | 'createdAt' | 'restrictions'> & {
  restrictions: StoredRestriction[];
};
type Dismissed = { guest: string; rule: string; avoid: string[] };

/** The last finished plan stays visible while a new one is pending or after one fails. */
type Saved = {
  status: 'pending' | 'failed' | 'done';
  fingerprint: string;
  createdAt: string;
  ticket?: number;
  plan?: StoredPlan;
  options?: PlanOptions;
};

/** Ingredient groups a guest might name, expanded so a plain word match catches every dish. */
const DIET_GROUPS: Record<string, string[]> = {
  pork: ['pork', 'char siu', 'siu yuk', 'bacon', 'ham', 'lard', 'pig', 'trotter', 'luncheon'],
  beef: ['beef', 'brisket', 'oxtail'],
  shrimp: ['shrimp', 'prawn', 'dried shrimp', 'hae bee', 'belacan', 'har gow', 'xo'],
  shellfish: ['shellfish', 'seafood', 'shrimp', 'prawn', 'dried shrimp', 'hae bee', 'belacan', 'har gow', 'xo', 'crab', 'lobster', 'scallop', 'clam', 'oyster', 'mussel', 'abalone', 'lala'],
  seafood: ['seafood', 'fish', 'shrimp', 'prawn', 'dried shrimp', 'hae bee', 'belacan', 'har gow', 'xo', 'crab', 'lobster', 'scallop', 'clam', 'oyster', 'mussel', 'squid', 'cuttlefish', 'octopus', 'abalone', 'sea cucumber', 'anchovy', 'lala'],
  fish: ['fish', 'anchovy', 'salmon', 'cod', 'grouper', 'tilapia'],
  nuts: ['nut', 'peanut', 'cashew', 'almond', 'walnut', 'satay'],
  peanut: ['peanut', 'groundnut', 'satay'],
  egg: ['egg', 'omelette', 'foo yong'],
  dairy: ['milk', 'cheese', 'butter', 'cream', 'dairy'],
  spicy: ['spicy', 'chilli', 'chili', 'sambal', 'curry', 'mala'],
  alcohol: ['beer', 'wine', 'liquor', 'alcohol', 'sake', 'soju', 'whisky', 'cocktail', 'carlsberg', 'heineken', 'guinness'],
};
const MEAT = ['meat', 'chicken', 'duck', 'goose', 'lamb', 'mutton', ...DIET_GROUPS.pork, ...DIET_GROUPS.beef, ...DIET_GROUPS.seafood];
DIET_GROUPS.vegetarian = MEAT;
DIET_GROUPS.vegan = [...MEAT, ...DIET_GROUPS.egg, ...DIET_GROUPS.dairy];
DIET_GROUPS.halal = [...DIET_GROUPS.pork, ...DIET_GROUPS.alcohol];
const DIET_ALIASES: Record<string, string> = { nut: 'nuts', peanuts: 'peanut', eggs: 'egg', prawns: 'shrimp', shrimps: 'shrimp', chilli: 'spicy', chili: 'spicy' };
const NOT_INGREDIENTS = new Set(['no', 'not', 'free', 'allergy', 'allergic', 'to', 'eat', "don't", 'dont', 'avoid', 'without', 'and', 'or', 'food', 'diet', 'intolerant', 'intolerance']);

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function avoidPattern(terms: string[]) {
  const words = new Set<string>();
  for (const term of terms) {
    const phrase = term.toLowerCase().trim();
    for (const key of [phrase, ...phrase.split(/[\s,/]+/)]) {
      const word = DIET_ALIASES[key] ?? key;
      if (!word || NOT_INGREDIENTS.has(word)) continue;
      for (const w of DIET_GROUPS[word] ?? [word]) words.add(w);
    }
  }
  if (words.size === 0) return null;
  return new RegExp(`\\b(?:${[...words].map(escape).join('|')})(?:e?s)?\\b`, 'i');
}

const sameGuest = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const isDismissed = (r: PlanRestriction, dismissed: Dismissed[]) =>
  !r.certain &&
  dismissed.some(
    (d) =>
      sameGuest(d.guest, r.guest) &&
      (sameGuest(d.rule, r.rule) || r.avoid.some((w) => d.avoid.some((x) => sameGuest(w, x)))),
  );

/** The course a menu section belongs to, for dishes the model left without one. */
function courseFor(category: string | undefined): TablePlanItemDto['course'] {
  const name = category?.toLowerCase() ?? '';
  if (/beverage|drink|tea|juice/.test(name)) return 'drink';
  if (/dessert|sweet/.test(name)) return 'dessert';
  if (/rice|noodle/.test(name)) return 'carb';
  if (/vegetable/.test(name)) return 'vegetable';
  return 'main';
}

const totalOf = (items: TablePlanItemDto[]) =>
  Math.round(
    items.reduce(
      (sum, i) => (i.shouldCalculate && i.price !== null ? sum + i.price * i.quantity : sum),
      0,
    ) * 100,
  ) / 100;

/**
 * Gives everyone exactly one drink and one dessert, then trims to the budget: desserts and
 * snacks go first, then extra mains and vegetables (keeping two mains and one vegetable);
 * drinks and the carb always stay.
 */
function fitToTable(items: TablePlanItemDto[], partySize: number, budgetPerPerson: number | null) {
  let planned = items.map((i) => ({ ...i }));
  for (const course of PER_PERSON_COURSES) {
    const group = planned.filter((i) => i.course === course);
    let missing = partySize - group.reduce((sum, i) => sum + i.quantity, 0);
    if (group.length > 0 && missing > 0) group[0].quantity += missing;
    // too many for the table: take the extras off the last kinds first
    for (const item of [...group].reverse()) {
      if (missing >= 0) break;
      const cut = Math.min(item.quantity, -missing);
      item.quantity -= cut;
      missing += cut;
    }
    planned = planned.filter((i) => i.quantity > 0);
  }
  if (budgetPerPerson === null) return planned;

  const limit = budgetPerPerson * partySize * BUDGET_SLACK;
  for (const course of TRIM_ORDER) {
    while (totalOf(planned) > limit) {
      const group = planned.filter((i) => i.course === course);
      const floor = course === 'main' ? MIN_MAINS : course === 'vegetable' ? 1 : 0;
      if (group.length <= floor) break;
      const dropped = group[group.length - 1];
      planned = planned.filter((i) => i !== dropped);
    }
  }
  return planned;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const fingerprintOf = (value: unknown) =>
  createHash('sha1').update(JSON.stringify(value)).digest('hex');
const nameIn = (rows: { language: string; name: string }[], lang: string) =>
  rows.find((r) => r.language === lang)?.name ?? rows.find((r) => r.language === 'en')?.name ?? rows[0]?.name ?? '';

@Injectable()
export class TablePlanService {
  constructor(
    private worker: WorkerService,
    private events: EventService,
  ) {}

  private planKey = (tableId: string, lang: string) => `plan:v3:${tableId}:${lang}`;
  private dismissedKey = (tableId: string) => `plan:dismissed:${tableId}`;

  private async loadTable(tableId: string, lang: string) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: {
        capacity: true,
        eventId: true,
        people: {
          select: {
            name: true,
            personalNotes: { select: { content: true }, take: 1 },
          },
          orderBy: { name: 'asc' },
        },
        orders: {
          select: {
            variantId: true,
            quantity: true,
            variant: {
              select: {
                food: {
                  select: {
                    translations: {
                      where: { language: { in: [lang, 'en'] } },
                      select: { language: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');

    const guests = table.people.map((p) => ({
      name: p.name,
      note: p.personalNotes[0]?.content?.trim() || null,
    }));
    return {
      table,
      guests,
      fingerprint: fingerprintOf({
        guests,
        orders: table.orders.map((o) => [o.variantId, o.quantity]).sort(),
      }),
    };
  }

  /** Once the table orders a plan it is done; dismissed restrictions stay for the next one. */
  async clear(tableId: string) {
    await Promise.all(
      SUPPORTED_LOCALES.map((lang) => CacheService.delete(this.planKey(tableId, lang))),
    );
  }

  private async state(tableId: string, lang: string): Promise<TablePlanStateDto> {
    const [{ fingerprint }, saved] = await Promise.all([
      this.loadTable(tableId, lang),
      CacheService.get<Saved>(this.planKey(tableId, lang)),
    ]);
    if (!saved) return { status: 'idle', plan: null, position: null };

    const lost =
      saved.status === 'pending' && Date.now() - Date.parse(saved.createdAt) > PENDING_TIMEOUT_MS;
    const status = lost ? 'failed' : saved.status;
    const plan = saved.plan
      ? {
          ...saved.plan,
          restrictions: saved.plan.restrictions.map(({ id, guest, label, certain }) => ({
            id,
            guest,
            label,
            certain,
          })),
          createdAt: saved.createdAt,
          isStale: saved.fingerprint !== fingerprint,
        }
      : null;
    const position =
      status === 'pending' && saved.ticket
        ? Math.max(0, saved.ticket - Number((await CacheService.get<number>(SERVED_KEY)) ?? 0) - 1)
        : null;
    return { status, plan, position };
  }

  get(tableId: string, lang: string) {
    return this.state(tableId, lang);
  }

  async request(
    tableId: string,
    lang: string,
    requested: PlanOptions,
    isAdmin = false,
    dismiss: string[] = [],
    rework: PlanRework | null = null,
  ) {
    const { table, fingerprint } = await this.loadTable(tableId, lang);
    // planning only helps while the table can still pre-order
    if (!isAdmin && (await this.events.stageOf(table.eventId)) !== 'open')
      throw new ForbiddenException('Pre-ordering is not open');
    const key = this.planKey(tableId, lang);
    const current = await CacheService.get<Saved>(key);
    const waiting =
      current?.status === 'pending' &&
      Date.now() - Date.parse(current.createdAt) <= PENDING_TIMEOUT_MS;
    if (waiting) return this.state(tableId, lang);

    const dismissing = (current?.plan?.restrictions ?? []).filter(
      (r) => !r.certain && dismiss.includes(r.id),
    );
    if (dismissing.length > 0) {
      const dismissed = (await CacheService.get<Dismissed[]>(this.dismissedKey(tableId))) ?? [];
      await CacheService.set(
        this.dismissedKey(tableId),
        [...dismissed, ...dismissing.map(({ guest, rule, avoid }) => ({ guest, rule, avoid }))],
        PLAN_TTL,
      );
    } else if (
      !isAdmin &&
      (await CacheService.increment(`plan:cooldown:${tableId}`, COOLDOWN_SECONDS)) > 1
    )
      throw new HttpException('This table just got a plan. Give it a moment.', HttpStatus.TOO_MANY_REQUESTS);

    // a dismissal or rework builds on the same plan, so it keeps the headcount and budget it had
    const options =
      dismissing.length > 0 || rework ? (current?.options ?? requested) : requested;
    const ticket = await CacheService.increment(TICKET_KEY, PLAN_TTL);
    await CacheService.set(
      key,
      {
        status: 'pending',
        fingerprint: current?.fingerprint ?? fingerprint,
        createdAt: new Date().toISOString(),
        ticket,
        plan: current?.plan,
        options,
      } satisfies Saved,
      PLAN_TTL,
    );
    await CacheService.pushList(
      QUEUE_KEY,
      { tableId, lang, ticket, options, rework } satisfies QueuedPlan,
      QUEUE_TTL,
    );
    await this.wakeWorker();
    return this.state(tableId, lang);
  }

  private async wakeWorker() {
    if ((await CacheService.increment(WORKER_KEY, WORKER_LOCK_TTL)) > 1) return;
    try {
      await this.worker.dispatch('drain-table-plans', () => this.drain());
    } catch (err) {
      console.error('[Table plan] Failed to start the worker', err);
      await CacheService.delete(WORKER_KEY);
    }
  }

  /** Works through queued plans a few at a time, so a rush of tables never floods the AI. */
  async drain() {
    const startedAt = Date.now();
    await CacheService.set(WORKER_KEY, 1, WORKER_LOCK_TTL);
    const lane = async () => {
      while (Date.now() - startedAt < WORKER_BUDGET_MS) {
        const item = await CacheService.popList<QueuedPlan>(QUEUE_KEY);
        if (!item) return;
        const began = Date.now();
        await this.process(item);
        const wait = MIN_REQUEST_GAP_MS - (Date.now() - began);
        if (wait > 0) await sleep(wait);
      }
    };
    await Promise.all(Array.from({ length: WORKER_CONCURRENCY }, lane));

    await CacheService.delete(WORKER_KEY);
    if ((await CacheService.listLength(QUEUE_KEY)) > 0) await this.wakeWorker();
    return { ok: true };
  }

  private async process({ tableId, lang, ticket, options, rework }: QueuedPlan) {
    const key = this.planKey(tableId, lang);
    const served = Number((await CacheService.get<number>(SERVED_KEY)) ?? 0);
    if (ticket > served) await CacheService.set(SERVED_KEY, ticket, PLAN_TTL);

    const saved = await CacheService.get<Saved>(key);
    if (saved?.status !== 'pending' || saved.ticket !== ticket) return;

    try {
      const { plan, fingerprint } = await this.plan(
        tableId,
        lang,
        options,
        rework
          ? {
              ...rework,
              restrictions: saved.plan?.restrictions ?? [],
              reasons: new Map((saved.plan?.items ?? []).map((i) => [i.variantId, i.reason])),
            }
          : null,
      );
      await CacheService.set(
        key,
        (plan
          ? { status: 'done', fingerprint, createdAt: new Date().toISOString(), plan, options }
          : { ...saved, status: 'failed' }) satisfies Saved,
        PLAN_TTL,
      );
    } catch (err) {
      console.error(`[Table plan] ${tableId} failed`, err);
      await CacheService.set(key, { ...saved, status: 'failed' }, PLAN_TTL);
    }
  }

  private async plan(
    tableId: string,
    lang: string,
    options: PlanOptions,
    rework: (PlanRework & { restrictions: StoredRestriction[]; reasons: Map<string, string> }) | null,
  ) {
    const { table, guests, fingerprint } = await this.loadTable(tableId, lang);
    const [foods, popularity, preset] = await Promise.all([
      prisma.food.findMany({
        where: { isAvailable: true },
        select: {
          id: true,
          imageUrl: true,
          shouldCalculate: true,
          isRecommended: true,
          translations: {
            where: { language: { in: [lang, 'en'] } },
            select: { language: true, name: true, description: true },
          },
          category: {
            select: {
              translations: {
                where: { language: { in: [lang, 'en'] } },
                select: { language: true, name: true },
              },
            },
          },
          variants: {
            where: { isAvailable: true },
            select: {
              id: true,
              price: true,
              currency: true,
              isSeasonal: true,
              translations: {
                where: { language: { in: [lang, 'en'] } },
                select: { language: true, label: true },
              },
              eventPrices: table.eventId
                ? { where: { eventId: table.eventId }, select: { price: true } }
                : false,
            },
          },
        },
      }),
      prisma.order.groupBy({ by: ['variantId'], _sum: { quantity: true } }),
      this.presetFoods(table.eventId, lang),
    ]);
    const dismissed = (await CacheService.get<Dismissed[]>(this.dismissedKey(tableId))) ?? [];

    const ordered = new Map(popularity.map((p) => [p.variantId, p._sum.quantity ?? 0]));
    const modifying = Boolean(options.modify);
    // when modifying, what the table ordered is the starting point, so it stays on the menu
    const orderedVariants = new Set(modifying ? [] : table.orders.map((o) => o.variantId));
    const tableOrders = new Map<string, number>();
    for (const o of table.orders) tableOrders.set(o.variantId, (tableOrders.get(o.variantId) ?? 0) + o.quantity);
    const startFrom =
      rework?.current ??
      (modifying ? [...tableOrders].map(([variantId, quantity]) => ({ variantId, quantity })) : null);
    const items = new Map<string, TablePlanItemDto>();
    const searchText = new Map<string, string>();
    const courseOf = new Map<string, TablePlanItemDto['course']>();
    // the model sees short ids instead of uuids, which cost far more tokens
    const shortIds = new Map<string, string>();
    const variantIds = new Map<string, string>();
    const menu: PlanMenuItem[] = foods.flatMap((food) => {
      const dish = nameIn(food.translations, lang);
      if (!dish) return [];
      const description =
        (food.translations.find((t) => t.language === lang) ?? food.translations[0])?.description?.trim() || null;
      const category = nameIn(food.category.translations, lang) || null;
      return food.variants
        .filter((v) => !orderedVariants.has(v.id) && !preset.variantIds.has(v.id))
        .map((v) => {
          const label =
            (v.translations.find((t) => t.language === lang) ?? v.translations.find((t) => t.language === 'en'))
              ?.label?.trim() || null;
          const seasonal = Array.isArray(v.eventPrices) ? v.eventPrices[0]?.price : undefined;
          const raw = v.isSeasonal ? seasonal : v.price;
          const price = raw == null ? null : Number(raw);
          courseOf.set(v.id, courseFor(food.category.translations.find((t) => t.language === 'en')?.name));
          searchText.set(
            v.id,
            [
              ...food.translations.flatMap((t) => [t.name, t.description ?? '']),
              ...food.category.translations.map((t) => t.name),
              ...v.translations.map((t) => t.label),
            ].join(' '),
          );
          items.set(v.id, {
            course: 'main',
            foodId: food.id,
            variantId: v.id,
            name: dish,
            label: food.variants.length > 1 ? label : null,
            imageUrl: food.imageUrl,
            price,
            currency: v.currency,
            shouldCalculate: food.shouldCalculate,
            quantity: 1,
            reason: '',
          });
          const shortId = String(shortIds.size + 1);
          shortIds.set(v.id, shortId);
          variantIds.set(shortId, v.id);
          return {
            id: shortId,
            dish,
            option: food.variants.length > 1 ? label : null,
            category,
            description: description && description.slice(0, MAX_DESCRIPTION),
            price,
            timesOrdered: ordered.get(v.id) ?? 0,
            staffPick: food.isRecommended,
            joke: !food.shouldCalculate,
          };
        });
    });
    if (menu.length === 0) return { plan: null, fingerprint };

    const partySize = Math.max(options.headcount ?? table.people.length, 1);
    const result = await AiService.planTable(lang, {
      partySize,
      budgetPerPerson: options.budgetPerPerson,
      preference: options.preference,
      noAlcohol: !options.alcohol,
      guests,
      alreadyOrdered: modifying
        ? []
        : table.orders.map((o) => ({
            dish: nameIn(o.variant.food.translations, lang),
            quantity: o.quantity,
          })),
      setMenu:
        preset.items.length > 0
          ? { pricePerTable: preset.price, includes: preset.items, note: preset.note }
          : null,
      notRestrictions: dismissed.map(({ guest, rule }) => ({ guest, rule })),
      tableNote: rework?.note ?? options.modify?.note ?? null,
      startFrom: startFrom
        ? startFrom.flatMap((i) => {
            const id = shortIds.get(i.variantId);
            return id ? [{ id, quantity: i.quantity }] : [];
          })
        : null,
      knownRestrictions: rework ? rework.restrictions : null,
      menu,
    });
    if (!result) return { plan: null, fingerprint };

    // the model can miss its own restrictions, so every one is enforced here as well
    const restrictions = result.restrictions
      .filter((r) => !isDismissed(r, dismissed))
      .map((r) => ({ ...r, id: fingerprintOf([r.guest.toLowerCase(), r.rule.toLowerCase()]).slice(0, 12) }));
    const unsafe = avoidPattern([
      ...restrictions.flatMap((r) => [r.rule, ...r.avoid]),
      ...(options.alcohol ? [] : ['alcohol']),
    ]);
    // dishes the table chose themselves stay; only what the AI adds must respect the notes
    const chosen = new Set(modifying ? tableOrders.keys() : []);
    const picks = result.picks
      .map((p) => ({ ...p, id: variantIds.get(p.id)! }))
      .filter((p) => chosen.has(p.id) || !unsafe?.test(searchText.get(p.id) ?? ''));
    if (picks.length < result.picks.length)
      console.warn(`[Table plan] Dropped ${result.picks.length - picks.length} dishes that broke a dietary note`);
    if (picks.length === 0 && !startFrom?.length) return { plan: null, fingerprint };

    const picked = picks.map((p) => ({
      ...items.get(p.id)!,
      course: p.course,
      quantity: p.quantity,
      // a dish the table kept keeps its original joke
      reason: rework?.reasons.get(p.id) || p.reason,
    }));
    // only an explicit quantity 0 removes a dish the table had; one the model skipped stays
    const touched = new Set([...picked.map((p) => p.variantId), ...result.removed.map((id) => variantIds.get(id))]);
    for (const s of startFrom ?? []) {
      const item = items.get(s.variantId);
      const safe = chosen.has(s.variantId) || !unsafe?.test(searchText.get(s.variantId) ?? '');
      if (item && safe && !touched.has(s.variantId))
        picked.push({
          ...item,
          course: courseOf.get(s.variantId) ?? 'main',
          quantity: s.quantity,
          reason: rework?.reasons.get(s.variantId) ?? '',
        });
    }
    // a modified order is the table's own, so it isn't topped up or trimmed to a budget
    const planned = modifying ? picked : fitToTable(picked, partySize, options.budgetPerPerson);
    const plan: StoredPlan = {
      title: result.title,
      intro: result.intro,
      restrictions,
      items: planned,
      headcount: partySize,
      budgetPerPerson: options.budgetPerPerson,
      preference: options.preference,
      alcohol: options.alcohol,
      mode: modifying ? 'modify' : 'plan',
      baseline: modifying
        ? [...tableOrders].map(([variantId, quantity]) => ({ variantId, quantity }))
        : [],
      estimatedTotal: totalOf(planned),
    };
    return { plan, fingerprint };
  }

  private async presetFoods(eventId: string | null, lang: string) {
    const languages = [lang, 'en'];
    const select = {
      price: true,
      translations: {
        where: { language: { in: languages } },
        select: { language: true, note: true },
      },
      foods: {
        select: {
          variantId: true,
          quantity: true,
          variant: {
            select: {
              food: {
                select: {
                  translations: {
                    where: { language: { in: languages } },
                    select: { language: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.PresetMenuSelect;
    const event = eventId
      ? await prisma.event.findUnique({
          where: { id: eventId },
          select: { isActive: true, presetMenu: { select } },
        })
      : null;
    const preset =
      event?.presetMenu ??
      (event?.isActive
        ? await prisma.presetMenu.findFirst({ where: { isActive: true }, select })
        : null);
    const foods = preset?.foods ?? [];
    const note =
      (preset?.translations.find((t) => t.language === lang) ?? preset?.translations[0])?.note?.trim() ||
      null;
    return {
      price: preset ? Number(preset.price) : 0,
      note,
      variantIds: new Set(foods.map((f) => f.variantId)),
      items: foods.map((f) => ({
        dish: nameIn(f.variant.food.translations, lang),
        quantity: f.quantity,
      })),
    };
  }
}
