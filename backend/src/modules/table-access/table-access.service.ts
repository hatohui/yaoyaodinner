import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AI_AUDIT_ACTIONS } from '@modules/table/dto/table-audit.dto';
import { prisma } from '../../libs/prisma';
import { ADMIN_HEADER } from '@common/auth/admin';
import {
  CLIENT_HEADER,
  CLIENT_NAME,
  EVENT_PIN_HEADER,
  PERSON_HEADER,
  TABLE_ACCESS_HEADER,
} from '@common/auth/table-access';
import { OrderRound } from '@prisma/client';
import { ConfigService } from '@modules/config/config.service';
import { EventService } from '@modules/event/event.service';
import { CONFIG_KEYS } from '@common/config/registry';

type Headers = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const FINALIZED = 'This event is finalized';

const allowedOrigins = () =>
  (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter((o) => o && o !== '*');

const originOf = (headers: Headers) => {
  const origin = first(headers.origin);
  if (origin) return origin.replace(/\/$/, '');
  const referer = first(headers.referer);
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
};

/** Who asked for an AI generation, for the audit log. */
export type AiCaller = {
  actor: 'admin' | 'guest';
  person: { id: string; name: string } | null;
  table: { id: string; eventId: string | null; no: number; name: string | null };
};

/**
 * Edits to a table's people, notes, orders and details need that table's code
 * (or the admin passphrase), and nobody can edit once the event is finalized.
 * Failures are 403, not 401: the client treats 401 as an expired event PIN and
 * would send the guest back to the PIN screen.
 */
@Injectable()
export class TableAccessService {
  constructor(
    private config: ConfigService,
    private events: EventService,
  ) {}

  private async isAdmin(headers: Headers) {
    const provided = first(headers[ADMIN_HEADER]);
    const passphrase = await this.config.getAdminPassphrase();
    return Boolean(provided && passphrase && provided === passphrase);
  }

  private async tableEventId(tableId: string) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { eventId: true },
    });
    return table?.eventId ?? null;
  }

  /**
   * New orders join the round the event is in: pre-orders until dinner, then
   * dinner orders. Admins can add pre-orders while guests are locked out.
   */
  async roundForNewOrder(tableId: string, headers: Headers): Promise<OrderRound> {
    const stage = await this.events.stageOf(await this.tableEventId(tableId));
    if (stage === 'dinner') return 'dinner';
    if (stage === 'open' || (await this.isAdmin(headers))) return 'pre';
    throw new ForbiddenException(
      stage === 'closed' ? "Ordering hasn't opened yet" : 'Orders are confirmed',
    );
  }

  /** Splits stay editable; items and prices only while their round is open. */
  async forOrderChange(
    orderId: string,
    headers: Headers,
    change: { items?: boolean; price?: boolean },
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { tableId: true, eventId: true, round: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    await this.forTable(order.tableId, headers);
    if (!change.items && !change.price) return;
    if (await this.isAdmin(headers)) return;

    const stage = await this.events.stageOf(
      order.eventId ?? (await this.tableEventId(order.tableId)),
    );
    const roundOpen = order.round === 'pre' ? stage === 'open' : stage === 'dinner';
    if (!roundOpen) throw new ForbiddenException('These orders are locked');

    if (
      change.price &&
      (order.round !== 'dinner' ||
        !(await this.config.get<boolean>(CONFIG_KEYS.dinnerPriceEditable)))
    ) {
      throw new ForbiddenException("This price can't be changed");
    }
  }

  async requireAdmin(headers: Headers) {
    if (!(await this.isAdmin(headers))) {
      throw new ForbiddenException('Admin access required');
    }
  }

  async requireFeature(key: string, headers: Headers) {
    if (await this.isAdmin(headers)) return;
    if (!(await this.config.get<boolean>(key))) {
      throw new ForbiddenException('This feature is currently disabled');
    }
  }

  async forEventPin(headers: Headers) {
    if (await this.isAdmin(headers)) return;
    const meta = await this.events.getActiveMeta();
    const pin = first(headers[EVENT_PIN_HEADER]);
    if (!meta || !pin || pin !== meta.pin) {
      throw new ForbiddenException('Enter the event PIN to continue');
    }
  }

  async forHeldTable(headers: Headers) {
    if (await this.isAdmin(headers)) return;
    await this.forEventPin(headers);
    if (!(await this.config.get<boolean>(CONFIG_KEYS.featureTableCodes))) return;

    const raw = first(headers[TABLE_ACCESS_HEADER]) ?? '';
    const split = raw.indexOf(':');
    const heldId = split === -1 ? '' : raw.slice(0, split);
    await this.forTable(heldId, headers);
  }

  async forTable(tableId: string | null | undefined, headers: Headers) {
    if (tableId) {
      const stage = await this.events.stageOf(await this.tableEventId(tableId));
      if (stage === 'finalized') throw new ForbiddenException(FINALIZED);
    }
    if (await this.isAdmin(headers)) return;
    await this.forEventPin(headers);
    // with codes off, the event PIN is the only gate on table edits
    if (!(await this.config.get<boolean>(CONFIG_KEYS.featureTableCodes))) return;

    const raw = first(headers[TABLE_ACCESS_HEADER]) ?? '';
    const split = raw.indexOf(':');
    const heldId = split === -1 ? '' : raw.slice(0, split);
    const code = split === -1 ? '' : raw.slice(split + 1);

    if (!tableId || !code || heldId !== tableId) {
      throw new ForbiddenException('Enter this table\'s code to make changes');
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { code: true },
    });
    if (!table || table.code !== code) {
      throw new ForbiddenException('That table code is not valid');
    }
  }

  async forPerson(personId: string, headers: Headers) {
    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: { tableId: true },
    });
    if (!person) throw new NotFoundException('Person not found');
    return this.forTable(person.tableId, headers);
  }

  async forNote(noteId: string, headers: Headers) {
    const note = await prisma.personalNote.findUnique({
      where: { id: noteId },
      select: { personId: true },
    });
    if (!note) throw new NotFoundException('Note not found');
    return this.forPerson(note.personId, headers);
  }

  /**
   * AI calls cost money, so they need our web client, the event PIN and a
   * claimed guest who sits at this table. Admins only need the web client.
   */
  async forAi(tableId: string, headers: Headers): Promise<AiCaller> {
    const allowed = allowedOrigins();
    const origin = originOf(headers);
    if (
      first(headers[CLIENT_HEADER]) !== CLIENT_NAME ||
      (allowed.length > 0 && (!origin || !allowed.includes(origin)))
    ) {
      throw new ForbiddenException('Use the YaoYao app to do this');
    }

    const found = await prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, eventId: true, no: true, slot: { select: { name: true } } },
    });
    if (!found) throw new NotFoundException('Table not found');
    const table = {
      id: found.id,
      eventId: found.eventId,
      no: found.no,
      name: found.slot?.name || null,
    };

    if (await this.isAdmin(headers)) {
      return { actor: 'admin', person: null, table };
    }

    await this.forEventPin(headers);
    const meta = await this.events.getActiveMeta();
    if (!meta || table.eventId !== meta.id) {
      throw new ForbiddenException('This table is not part of the current event');
    }

    const personId = first(headers[PERSON_HEADER]);
    const person = personId
      ? await prisma.people.findUnique({
          where: { id: personId },
          select: { id: true, name: true, tableId: true },
        })
      : null;
    if (!person || person.tableId !== table.id) {
      throw new ForbiddenException('Pick who you are at this table first');
    }
    await this.withinAiLimit(person.id);
    return { actor: 'guest', person: { id: person.id, name: person.name }, table };
  }

  /** One prankster can't run up the AI bill: every guest gets a daily allowance. */
  private async withinAiLimit(personId: string) {
    const limit = await this.config.get<number>(CONFIG_KEYS.aiGuestDailyLimit);
    if (!limit || limit <= 0) return;
    const used = await prisma.tableAudit.count({
      where: {
        action: { in: [...AI_AUDIT_ACTIONS] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        details: { path: ['personId'], equals: personId },
      },
    });
    if (used >= limit) {
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, code: 'ai_daily_limit', message: 'You have used the AI a lot today. Try again tomorrow.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
