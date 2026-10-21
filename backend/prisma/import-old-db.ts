import "dotenv/config";
import { Client } from "pg";
import { randomUUID } from "crypto";
import { generatePin } from "../src/common/pin";

// Copies people and orders (plus the events, tables, notes and splits they
// hang off) from OLD_DATABASE_URL into DATABASE_URL. The menu is not copied:
// each old order is re-pointed at the matching variant in the current menu.
// The old app had no events, so anything without one lands in LEGACY_EVENT.
//
//   bun prisma/import-old-db.ts            dry run, rolls back
//   bun prisma/import-old-db.ts --apply    commits

const APPLY = process.argv.includes("--apply");
const LEGACY_EVENT = { id: "furum-2025", name: "Furum 2025" };

type Row = Record<string, any>;

interface VariantInfo {
  id: string;
  category: string;
  food: string;
  label: string;
  price: string;
}

const norm = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const priceKey = (p: unknown) => (p == null ? "" : Number(p).toFixed(2));

async function columns(db: Client, table: string): Promise<Set<string>> {
  const { rows } = await db.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

async function selectAll(db: Client, table: string): Promise<Row[]> {
  if ((await columns(db, table)).size === 0) return [];
  const { rows } = await db.query(`SELECT * FROM "${table}"`);
  return rows;
}

async function loadVariants(db: Client): Promise<VariantInfo[]> {
  const variantCols = await columns(db, "food_variant");
  const categoryCols = await columns(db, "category");
  const hasVariantTranslations =
    (await columns(db, "food_variant_translation")).size > 0;

  const translatedLabel = `(SELECT vt.label FROM food_variant_translation vt
    WHERE vt.variant_id = v.id ORDER BY vt.language = 'en' DESC LIMIT 1)`;
  const label = [
    hasVariantTranslations ? translatedLabel : null,
    variantCols.has("label") ? "v.label" : null,
    `''`,
  ].filter(Boolean);
  const categoryKey = categoryCols.has("key") ? "c.key" : "c.name";

  const { rows } = await db.query(`
    SELECT v.id, v.price,
      COALESCE(${label.join(", ")}) AS label,
      (SELECT ft.name FROM food_translation ft
        WHERE ft.food_id = f.id ORDER BY ft.language = 'en' DESC LIMIT 1) AS food,
      ${categoryKey} AS category
    FROM food_variant v
    JOIN food f ON f.id = v.food_id
    LEFT JOIN category c ON c.id = f.category_id
  `);

  return rows.map((r) => ({
    id: r.id,
    category: norm(r.category),
    food: norm(r.food),
    label: norm(r.label),
    price: priceKey(r.price),
  }));
}

/** Matches old variants to current ones, loosening the key one step at a time
 *  and only accepting a step when it yields exactly one candidate. */
function matchVariants(oldVariants: VariantInfo[], newVariants: VariantInfo[]) {
  const newIds = new Set(newVariants.map((v) => v.id));
  const keys: ((v: VariantInfo) => string)[] = [
    (v) => [v.category, v.food, v.label, v.price].join("|"),
    (v) => [v.food, v.label, v.price].join("|"),
    (v) => [v.food, v.label].join("|"),
    (v) => v.food,
  ];
  const indexes = keys.map((key) => {
    const index = new Map<string, string[]>();
    for (const v of newVariants) {
      const k = key(v);
      index.set(k, [...(index.get(k) ?? []), v.id]);
    }
    return index;
  });

  const mapping = new Map<string, string>();
  const unmatched: VariantInfo[] = [];
  for (const v of oldVariants) {
    if (newIds.has(v.id)) {
      mapping.set(v.id, v.id);
      continue;
    }
    const hit = keys
      .map((key, i) => indexes[i].get(key(v)))
      .find((candidates) => candidates?.length === 1);
    if (hit) mapping.set(v.id, hit[0]);
    else unmatched.push(v);
  }
  return { mapping, unmatched };
}

async function insert(db: Client, table: string, rows: Row[]): Promise<number> {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const params: unknown[] = [];
    const values = rows.slice(i, i + 500).map(
      (r) =>
        `(${cols
          .map((c) => {
            params.push(r[c]);
            return `$${params.length}`;
          })
          .join(", ")})`,
    );
    const res = await db.query(
      `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")})
       VALUES ${values.join(", ")} ON CONFLICT DO NOTHING`,
      params,
    );
    inserted += res.rowCount ?? 0;
  }
  return inserted;
}

async function main() {
  const oldUrl = process.env.OLD_DATABASE_URL;
  const newUrl = process.env.DATABASE_URL;
  if (!oldUrl || !newUrl) {
    throw new Error("Set OLD_DATABASE_URL and DATABASE_URL in backend/.env");
  }
  if (oldUrl === newUrl) {
    throw new Error(
      "OLD_DATABASE_URL and DATABASE_URL point at the same database",
    );
  }

  const oldDb = new Client({ connectionString: oldUrl });
  const newDb = new Client({ connectionString: newUrl });
  await oldDb.connect();
  await newDb.connect();

  try {
    const oldEvents = await selectAll(oldDb, "event");
    const oldTables = await selectAll(oldDb, "table");
    const oldSlots = new Map(
      (await selectAll(oldDb, "table_slot")).map((s) => [s.id, s]),
    );
    const oldPeople = await selectAll(oldDb, "people");
    const oldNotes = await selectAll(oldDb, "personal_note");
    const oldOrders = await selectAll(oldDb, "order");
    const oldSplits = await selectAll(oldDb, "order_split");

    const { mapping: variantMap, unmatched } = matchVariants(
      await loadVariants(oldDb),
      await loadVariants(newDb),
    );
    const orderedVariantIds = new Set(oldOrders.map((o) => o.variant_id));
    const unmatchedOrdered = unmatched.filter((v) =>
      orderedVariantIds.has(v.id),
    );

    await newDb.query("BEGIN");

    const { rows: activeRows } = await newDb.query(
      "SELECT 1 FROM event WHERE is_active LIMIT 1",
    );
    const targetHasActiveEvent = activeRows.length > 0;
    const events: Row[] = oldEvents.map((e) => ({
      id: e.id,
      pin: e.pin,
      name: e.name,
      is_active: targetHasActiveEvent ? false : e.is_active,
      created_at: e.created_at,
    }));

    const { rows: targetSlots } = await newDb.query(
      "SELECT id, no, name FROM table_slot",
    );
    const slotByNo = new Map<number, string>(
      targetSlots.map((s) => [s.no, s.id]),
    );
    const slotByName = new Map<string, string>(
      targetSlots.map((s) => [norm(s.name), s.id]),
    );
    const newSlots: Row[] = [];

    const resolveSlot = (t: Row): string | null => {
      const old = t.slot_id ? oldSlots.get(t.slot_id) : null;
      const no: number | null = old?.no ?? (t.no >= 0 ? t.no : null);
      const name: string | null = old?.name ?? t.name ?? null;
      const existing =
        (no != null ? slotByNo.get(no) : undefined) ??
        (name ? slotByName.get(norm(name)) : undefined);
      if (existing) return existing;
      if (no == null) return null;

      const slot = {
        id: randomUUID(),
        no,
        name: name ?? `T${no}`,
        x: old?.x ?? t.x ?? null,
        y: old?.y ?? t.y ?? null,
        default_capacity: old?.default_capacity ?? t.capacity ?? 1,
        is_active: true,
      };
      newSlots.push(slot);
      slotByNo.set(slot.no, slot.id);
      slotByName.set(norm(slot.name), slot.id);
      return slot.id;
    };

    const peopleIds = new Set(oldPeople.map((p) => p.id));
    const tableEvent = new Map<string, string | null>(
      oldTables.map((t) => [t.id, t.event_id ?? null]),
    );
    let needsLegacyEvent = false;
    const eventFor = (eventId: string | null, tableId?: string | null) => {
      const id = eventId ?? (tableId ? tableEvent.get(tableId) : null);
      if (id) return id;
      needsLegacyEvent = true;
      return LEGACY_EVENT.id;
    };

    const { rows: seatedTables } = await newDb.query(
      'SELECT id, slot_id, event_id FROM "table" WHERE slot_id IS NOT NULL',
    );
    const oldTableIds = new Set(oldTables.map((t) => t.id));
    const usedSlotEvents = new Set<string>(
      seatedTables
        .filter((t) => !oldTableIds.has(t.id))
        .map((t) => `${t.slot_id}|${t.event_id}`),
    );
    const tables: Row[] = oldTables.map((t) => {
      const eventId = eventFor(t.event_id);
      let slotId = resolveSlot(t);
      if (slotId && usedSlotEvents.has(`${slotId}|${eventId}`)) {
        console.warn(
          `! table ${t.id}: slot already taken in its event, left unseated`,
        );
        slotId = null;
      }
      if (slotId) usedSlotEvents.add(`${slotId}|${eventId}`);
      return {
        id: t.id,
        slot_id: slotId,
        capacity: t.capacity,
        table_leader_id: peopleIds.has(t.table_leader_id)
          ? t.table_leader_id
          : null,
        is_staging: t.is_staging,
        event_id: eventId,
        banner_url: t.banner_url ?? null,
        code: t.code ?? generatePin(),
      };
    });
    const tableIds = new Set(tables.map((t) => t.id));

    const people: Row[] = oldPeople.map((p) => ({
      id: p.id,
      name: p.name,
      table_id: tableIds.has(p.table_id) ? p.table_id : null,
      event_id: eventFor(p.event_id, p.table_id),
      pfp_url: p.pfp_url ?? null,
    }));

    const notes: Row[] = oldNotes
      .filter((n) => peopleIds.has(n.person_id))
      .map((n) => ({ id: n.id, person_id: n.person_id, content: n.content }));

    const orders: Row[] = oldOrders
      .filter((o) => tableIds.has(o.table_id) && variantMap.has(o.variant_id))
      .map((o) => ({
        id: o.id,
        table_id: o.table_id,
        variant_id: variantMap.get(o.variant_id),
        event_id: eventFor(o.event_id, o.table_id),
        quantity: o.quantity,
        price: o.price,
        split_all: o.split_all ?? true,
        updated_at: o.updated_at ?? o.created_at,
        created_at: o.created_at,
      }));
    const orderIds = new Set(orders.map((o) => o.id));

    const splits: Row[] = oldSplits
      .filter((s) => orderIds.has(s.order_id) && peopleIds.has(s.person_id))
      .map((s) => ({ order_id: s.order_id, person_id: s.person_id }));

    if (needsLegacyEvent) {
      events.push({
        id: LEGACY_EVENT.id,
        pin: generatePin(),
        name: LEGACY_EVENT.name,
        is_active: false,
        created_at:
          oldOrders.map((o) => o.created_at).sort((a, b) => a - b)[0] ??
          new Date(),
      });
    }

    const summary = [
      ["event", oldEvents.length, events, await insert(newDb, "event", events)],
      ["table_slot", 0, newSlots, await insert(newDb, "table_slot", newSlots)],
      ["table", oldTables.length, tables, await insert(newDb, "table", tables)],
      [
        "people",
        oldPeople.length,
        people,
        await insert(newDb, "people", people),
      ],
      [
        "personal_note",
        oldNotes.length,
        notes,
        await insert(newDb, "personal_note", notes),
      ],
      ["order", oldOrders.length, orders, await insert(newDb, "order", orders)],
      [
        "order_split",
        oldSplits.length,
        splits,
        await insert(newDb, "order_split", splits),
      ],
    ].map(
      ([table, inOld, rows, inserted]: [string, number, Row[], number]) => ({
        table,
        "in old db": inOld,
        "to import": rows.length,
        inserted,
        "already there": rows.length - inserted,
      }),
    );
    console.table(summary);

    if (targetHasActiveEvent && oldEvents.some((e) => e.is_active)) {
      console.warn(
        "! the current db already has an active event, imported events were set inactive",
      );
    }
    if (unmatchedOrdered.length > 0) {
      const skipped = oldOrders.filter(
        (o) => !variantMap.has(o.variant_id),
      ).length;
      console.warn(
        `! ${skipped} orders skipped: no unique match in the current menu for these variants`,
      );
      console.table(
        unmatchedOrdered.map(({ id, category, food, label, price }) => ({
          id,
          category,
          food,
          label,
          price,
        })),
      );
    }

    if (APPLY) {
      await newDb.query("COMMIT");
      console.log("✓ Committed");
    } else {
      await newDb.query("ROLLBACK");
      console.log("Dry run, nothing written. Re-run with --apply to commit.");
    }
  } catch (err) {
    await newDb.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    await oldDb.end();
    await newDb.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
