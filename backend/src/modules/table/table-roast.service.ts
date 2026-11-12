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

type Saved = { text: string; fingerprint: string; createdAt: string };

const fingerprintOf = (value: unknown) =>
  createHash('sha1').update(JSON.stringify(value)).digest('hex');
const today = () => new Date().toISOString().slice(0, 10);

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
    return { tableCooldown, personCooldown, personDailyLimit, dailyLimit, maxMembers, ordering };
  }

  private tableKey = (tableId: string, lang: string) => `roast:table:${tableId}:${lang}`;
  private personKey = (personId: string, lang: string) => `roast:person:${personId}:${lang}`;
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
        slot: { select: { name: true } },
        people: {
          select: { id: true, name: true, pfpUrl: true },
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
        tableNo: table.no,
        tableName: table.slot?.name || null,
        capacity: table.capacity,
        members: people.map((p) => p.name),
        orders: ordering ? orders : null,
      },
    };
  }

  private async state(tableId: string, lang: string) {
    const { people, tableFingerprint, settings } = await this.load(tableId, lang);
    const { personDailyLimit } = settings;
    const table = await CacheService.get<Saved>(this.tableKey(tableId, lang));
    const members = await Promise.all(
      people.map(async (p) => {
        const [saved, used] = await Promise.all([
          CacheService.get<Saved>(this.personKey(p.id, lang)),
          CacheService.get<number>(this.personCountKey(p.id)),
        ]);
        return {
          personId: p.id,
          text: saved?.text ?? null,
          createdAt: saved?.createdAt ?? null,
          isStale: Boolean(saved) && saved!.fingerprint !== fingerprintOf([p.name, p.pfpUrl]),
          remainingToday: Math.max(0, personDailyLimit - Number(used ?? 0)),
        };
      }),
    );
    return {
      table: table
        ? {
            text: table.text,
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

  async roastTable(tableId: string, lang: string) {
    const { tableFingerprint, tableInput, settings } = await this.load(tableId, lang);
    const { tableCooldown, dailyLimit } = settings;
    if ((await CacheService.increment(`roast:cooldown:table:${tableId}`, tableCooldown)) > 1)
      tooMany('This table was just roasted. Give it a minute.');
    await this.spendBudget(dailyLimit);

    const text = await AiService.roastTable(lang, tableInput);
    if (!text) throw new ServiceUnavailableException("The roast didn't land. Try again.");

    await CacheService.increment(this.budgetKey(), DAY_TTL);
    await CacheService.set(
      this.tableKey(tableId, lang),
      { text, fingerprint: tableFingerprint, createdAt: new Date().toISOString() } satisfies Saved,
      ROAST_TTL,
    );
    return this.state(tableId, lang);
  }

  async roastPerson(tableId: string, personId: string, lang: string) {
    const { people, tableNo, tableName, settings } = await this.load(tableId, lang);
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
    const text = await AiService.roastPerson(
      lang,
      {
        name: person.name,
        tableNo,
        tableName,
        tableMates: people.filter((p) => p.id !== personId).map((p) => p.name),
      },
      image,
    );
    if (!text) throw new ServiceUnavailableException("The roast didn't land. Try again.");

    await Promise.all([
      CacheService.increment(this.budgetKey(), DAY_TTL),
      CacheService.increment(this.personCountKey(personId), DAY_TTL),
      CacheService.set(
        this.personKey(personId, lang),
        {
          text,
          fingerprint: fingerprintOf([person.name, person.pfpUrl]),
          createdAt: new Date().toISOString(),
        } satisfies Saved,
        ROAST_TTL,
      ),
    ]);
    return this.state(tableId, lang);
  }
}
