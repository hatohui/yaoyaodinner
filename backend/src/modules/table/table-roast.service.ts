import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { prisma } from '@libs/prisma';
import { AiService } from '@libs/ai';
import { CacheService } from '@libs/redis';
import { ImagesService } from '@modules/images/images.service';
import { ConfigService } from '@modules/config/config.service';
import { CONFIG_KEYS } from '@common/config/registry';

const ROAST_TTL = 3 * 24 * 60 * 60;
const DAY_TTL = 2 * 24 * 60 * 60;
const MAX_EARLIER_ROASTS = 10;
const MAX_MATES = 8;
const DIRTY_CHANCE = 0.7;
const CRINGE_CHANCE = 0.2;
const HORNY_HOOK =
  /(horny|slut|simp|whore|thot|lewd|kink|yiff|knot|rut|bulge|thicc|daddy|bottom|breed|sexy|nsfw|bdsm|fetish|eat|ate|swallow|ride|nuts?|suck|lick|bone|wood|mount|sausage|meat|cream|noodle|stuff|spit|tail|horn|hard|wet|deep|thick)|发情|骚|色狼|dâm|hứng|เงี่ยน|หื่น/i;

type Saved = {
  text: string;
  lang: string;
  fingerprint: string;
  createdAt: string;
  translations?: Record<string, string>;
};

const textIn = (saved: Saved, lang: string) =>
  saved.lang === lang ? saved.text : saved.translations?.[lang];

const fingerprintOf = (value: unknown) =>
  createHash('sha1').update(JSON.stringify(value)).digest('hex');
const today = () => new Date().toISOString().slice(0, 10);
const personFingerprint = (p: {
  name: string;
  pfpUrl: string | null;
  personalNotes: { content: string }[];
}) => fingerprintOf([p.name, p.pfpUrl, p.personalNotes[0]?.content ?? null]);

function tooMany(message: string): never {
  throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
}

@Injectable()
export class TableRoastService {
  constructor(
    private images: ImagesService,
    private config: ConfigService,
  ) {}

  private async settings() {
    const [tableCooldown, personCooldown, personDailyLimit, dailyLimit, maxMembers, ordering] =
      await Promise.all([
        this.config.get<number>(CONFIG_KEYS.roastTableCooldown),
        this.config.get<number>(CONFIG_KEYS.roastPersonCooldown),
        this.config.get<number>(CONFIG_KEYS.roastPersonDailyLimit),
        this.config.get<number>(CONFIG_KEYS.roastDailyLimit),
        this.config.get<number>(CONFIG_KEYS.roastMaxMembers),
        this.config.get<boolean>(CONFIG_KEYS.featureMenu),
      ]);
    return {
      tableCooldown,
      personCooldown,
      personDailyLimit,
      dailyLimit,
      maxMembers,
      ordering,
    };
  }

  private tableKey = (tableId: string) => `roast:v2:table:${tableId}`;
  private personKey = (personId: string) => `roast:v2:person:${personId}`;
  private personCountKey = (personId: string) => `roast:person-count:${personId}:${today()}`;
  private budgetKey = () => `roast:budget:${today()}`;

  private async load(tableId: string, lang: string) {
    const settings = await this.settings();
    const { maxMembers, ordering } = settings;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: {
        no: true,
        capacity: true,
        tableLeaderId: true,
        slot: { select: { name: true } },
        people: {
          select: {
            id: true,
            name: true,
            pfpUrl: true,
            personalNotes: { select: { content: true }, take: 1 },
          },
          orderBy: { name: 'asc' },
        },
        orders: {
          orderBy: { createdAt: 'asc' },
          select: {
            variantId: true,
            quantity: true,
            round: true,
            variant: {
              select: {
                food: {
                  select: {
                    shouldCalculate: true,
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

    const people = table.people.slice(0, maxMembers);
    // with ordering closed, the AI never sees orders and order changes don't stale the roast
    const tableOrders = ordering ? table.orders : [];
    const orders = tableOrders.map((o) => {
      const names = o.variant.food.translations;
      return {
        dish:
          names.find((t) => t.language === lang)?.name ??
          names.find((t) => t.language === 'en')?.name ??
          '',
        quantity: o.quantity,
        isJoke: !o.variant.food.shouldCalculate,
        addedDuringDinner: o.round === 'dinner',
      };
    });

    return {
      settings,
      people,
      host: table.people.find((p) => p.id === table.tableLeaderId)?.name ?? null,
      tableName: table.slot?.name || null,
      tableNo: table.no,
      tableFingerprint: fingerprintOf({
        slot: table.slot?.name ?? null,
        capacity: table.capacity,
        people: people.map((p) => [p.id, p.name]),
        ordering,
        orders: tableOrders.map((o) => [o.variantId, o.quantity, o.round]),
      }),
      tableInput: {
        tableName: table.slot?.name || null,
        host: table.people.find((p) => p.id === table.tableLeaderId)?.name ?? null,
        members: people.map((p) => ({
          name: p.name,
          note: p.personalNotes[0]?.content?.trim() || null,
        })),
        orders: ordering ? orders : null,
      },
    };
  }

  private async localize(
    entries: { key: string; saved: Saved | null }[],
    lang: string,
    names: string[],
  ) {
    const missing = entries.filter(
      (e): e is { key: string; saved: Saved } => Boolean(e.saved) && !textIn(e.saved!, lang),
    );
    if (missing.length === 0) return;
    const translated = await AiService.translateRoasts(
      lang,
      missing.map((e, i) => ({ id: String(i), text: e.saved.text })),
      names,
    );
    await Promise.all(
      missing.map(async (e, i) => {
        const text = translated?.[String(i)];
        if (!text) return;
        e.saved.translations = { ...e.saved.translations, [lang]: text };
        await CacheService.set(e.key, e.saved, ROAST_TTL);
      }),
    );
  }

  private async state(tableId: string, lang: string) {
    const { people, tableFingerprint, settings } = await this.load(tableId, lang);
    const { personDailyLimit } = settings;
    const [table, ...saved] = await Promise.all([
      CacheService.get<Saved>(this.tableKey(tableId)),
      ...people.map((p) => CacheService.get<Saved>(this.personKey(p.id))),
    ]);
    await this.localize(
      [
        { key: this.tableKey(tableId), saved: table },
        ...people.map((p, i) => ({
          key: this.personKey(p.id),
          saved: saved[i],
        })),
      ],
      lang,
      people.map((p) => p.name),
    );
    const members = await Promise.all(
      people.map(async (p, i) => {
        const used = await CacheService.get<number>(this.personCountKey(p.id));
        const roast = saved[i];
        return {
          personId: p.id,
          text: roast ? (textIn(roast, lang) ?? roast.text) : null,
          createdAt: roast?.createdAt ?? null,
          isStale: Boolean(roast) && roast!.fingerprint !== personFingerprint(p),
          remainingToday: Math.max(0, personDailyLimit - Number(used ?? 0)),
        };
      }),
    );
    return {
      table: table
        ? {
            text: textIn(table, lang) ?? table.text,
            createdAt: table.createdAt,
            isStale: table.fingerprint !== tableFingerprint,
          }
        : null,
      members,
    };
  }

  private async spendBudget(dailyLimit: number) {
    const used = Number((await CacheService.get<number>(this.budgetKey())) ?? 0);
    if (used >= dailyLimit) tooMany("Today's roasts are used up. Try again tomorrow.");
  }

  get(tableId: string, lang: string) {
    return this.state(tableId, lang);
  }

  private async earlierRoasts(
    tableId: string,
    people: { id: string; name: string }[],
    includeTable: boolean,
  ) {
    const [table, ...members] = await Promise.all([
      includeTable ? CacheService.get<Saved>(this.tableKey(tableId)) : null,
      ...people.map((p) => CacheService.get<Saved>(this.personKey(p.id))),
    ]);
    return [
      ...(table ? [{ about: 'the table', saved: table }] : []),
      ...people.flatMap((p, i) => {
        const saved = members[i];
        return saved ? [{ about: p.name, saved }] : [];
      }),
    ]
      .sort((a, b) => b.saved.createdAt.localeCompare(a.saved.createdAt))
      .slice(0, MAX_EARLIER_ROASTS)
      .map(({ about, saved }) => ({
        about,
        roast: saved.text.replace(/\n/g, ' '),
      }));
  }

  async roastTable(tableId: string, lang: string) {
    const { people, tableFingerprint, tableInput, settings } = await this.load(tableId, lang);
    const { tableCooldown, dailyLimit } = settings;
    if ((await CacheService.increment(`roast:cooldown:table:${tableId}`, tableCooldown)) > 1)
      tooMany('This table was just roasted. Give it a minute.');
    await this.spendBudget(dailyLimit);

    const text = await AiService.roastTable(lang, {
      ...tableInput,
      dirty:
        Math.random() < DIRTY_CHANCE ||
        tableInput.members.some((m) => HORNY_HOOK.test(`${m.name} ${m.note ?? ''}`)),
      cringe: Math.random() < CRINGE_CHANCE,
      earlierRoasts: await this.earlierRoasts(tableId, people, false),
    });
    if (!text) throw new ServiceUnavailableException("The roast didn't land. Try again.");

    await CacheService.increment(this.budgetKey(), DAY_TTL);
    await CacheService.set(
      this.tableKey(tableId),
      {
        text,
        lang,
        fingerprint: tableFingerprint,
        createdAt: new Date().toISOString(),
      } satisfies Saved,
      ROAST_TTL,
    );
    return this.state(tableId, lang);
  }

  async roastPerson(tableId: string, personId: string, lang: string) {
    const { people, host, tableName, settings } = await this.load(tableId, lang);
    const { personDailyLimit, personCooldown, dailyLimit } = settings;
    const person = people.find((p) => p.id === personId);
    if (!person) throw new NotFoundException('Person not found at this table');

    const used = Number((await CacheService.get<number>(this.personCountKey(personId))) ?? 0);
    if (used >= personDailyLimit) tooMany(`${person.name} has been roasted enough for today.`);
    if ((await CacheService.increment(`roast:cooldown:person:${personId}`, personCooldown)) > 1)
      tooMany(`${person.name} was just roasted. Give it a moment.`);
    await this.spendBudget(dailyLimit);

    const image = person.pfpUrl
      ? await this.images.readImage(person.pfpUrl).catch(() => null)
      : null;
    const others = people.filter((p) => p.id !== personId);
    const hasNote = (p: (typeof people)[number]) => Boolean(p.personalNotes[0]?.content?.trim());
    const note = person.personalNotes[0]?.content?.trim() || null;
    const text = await AiService.roastPerson(
      lang,
      {
        name: person.name,
        note,
        tableName,
        host,
        dirty: Math.random() < DIRTY_CHANCE,
        cringe: Math.random() < CRINGE_CHANCE,
        hornyHook: HORNY_HOOK.test(`${person.name} ${note ?? ''}`),
        mates: others
          .filter((p) => others.length < 3 || p.name !== host)
          .map((p) => ({ name: p.name, note: p.personalNotes[0]?.content?.trim() || null }))
          .sort(() => Math.random() - 0.5)
          .slice(0, MAX_MATES),
        tableMates: others.map((p) => p.name),
        onlyOneWithout:
          others.length === 0
            ? []
            : [
                ...(!person.pfpUrl && others.every((p) => p.pfpUrl) ? ['picture' as const] : []),
                ...(!hasNote(person) && others.every(hasNote) ? ['note' as const] : []),
              ],
        earlierRoasts: await this.earlierRoasts(tableId, people, true),
      },
      image,
    );
    if (!text) throw new ServiceUnavailableException("The roast didn't land. Try again.");

    await Promise.all([
      CacheService.increment(this.budgetKey(), DAY_TTL),
      CacheService.increment(this.personCountKey(personId), DAY_TTL),
      CacheService.set(
        this.personKey(personId),
        {
          text,
          lang,
          fingerprint: personFingerprint(person),
          createdAt: new Date().toISOString(),
        } satisfies Saved,
        ROAST_TTL,
      ),
    ]);
    return this.state(tableId, lang);
  }
}
