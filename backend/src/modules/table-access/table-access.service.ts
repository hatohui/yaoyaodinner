import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '../../libs/prisma';
import { ADMIN_HEADER } from '@common/auth/admin';
import { TABLE_ACCESS_HEADER } from '@common/auth/table-access';
import { ConfigService } from '@modules/config/config.service';
import { CONFIG_KEYS } from '@common/config/registry';

type Headers = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Edits to a table's people, notes, orders and details need that table's code
 * (or the admin passphrase). Failures are 403, not 401: the client treats 401
 * as an expired event PIN and would send the guest back to the PIN screen.
 */
@Injectable()
export class TableAccessService {
  constructor(private config: ConfigService) {}

  private async isAdmin(headers: Headers) {
    const provided = first(headers[ADMIN_HEADER]);
    const passphrase = await this.config.getAdminPassphrase();
    return Boolean(provided && passphrase && provided === passphrase);
  }

  /** Admins can still enter orders while guests wait for ordering to open. */
  async assertOrderingOpen(headers: Headers) {
    if (await this.isAdmin(headers)) return;
    if (!(await this.config.get<boolean>(CONFIG_KEYS.ordersOpen))) {
      throw new ForbiddenException("Ordering hasn't opened yet");
    }
  }

  async forTable(tableId: string | null | undefined, headers: Headers) {
    if (await this.isAdmin(headers)) return;
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

  async forOrder(orderId: string, headers: Headers) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { tableId: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.forTable(order.tableId, headers);
  }

  async forNote(noteId: string, headers: Headers) {
    const note = await prisma.personalNote.findUnique({
      where: { id: noteId },
      select: { personId: true },
    });
    if (!note) throw new NotFoundException('Note not found');
    return this.forPerson(note.personId, headers);
  }
}
