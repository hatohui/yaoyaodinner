import 'dotenv/config';
import { Client } from 'pg';
import { generatePin } from '../src/common/pin';

// Run via `task db:import:old`, `db:import:old:apply` or `db:import:old:inspect`.
// Copies tables, people and orders from the old Prisma app (OLD_DATABASE_URL)
// into DATABASE_URL, all under one inactive LEGACY_EVENT. The menu is not
// copied: each old order is re-pointed at the matching current variant.
// Old staging tables are later copies of the originals (via referenceId),
// people and orders included, so only non-staging tables are read.
//
//   bun prisma/import-old-db.ts            dry run, rolls back
//   bun prisma/import-old-db.ts --apply    commits
//   bun prisma/import-old-db.ts --inspect  lists the old db's tables and columns

const APPLY = process.argv.includes('--apply');
const INSPECT = process.argv.includes('--inspect');
const LEGACY_EVENT = { id: 'furum-2025', name: 'Furum 2025' };

type Row = Record<string, any>;

interface VariantInfo {
  id: string;
  category: string;
  foods: string[];
  label: string;
  price: string;
}

const norm = (s: unknown) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const priceKey = (p: unknown) => (p == null ? '' : Number(p).toFixed(2));

// The old app stored names as unbounded text; the current columns are varchar(255).
const truncated: string[] = [];
const fit = (s: string, what: string, cutTo = 255) => {
  if (s.length <= 255) return s;
  const short = s.slice(0, cutTo).trim();
  truncated.push(`${what}: "${short}" (was ${s.length} chars)`);
  return short;
};

const toVariant = (r: Row): VariantInfo => ({
  id: r.id,
  category: norm(r.category),
  foods: [...new Set([r.food, r.food_en].filter(Boolean).map(norm))],
  label: norm(r.label),
  price: priceKey(r.price),
});

/** Old variants, plus one pseudo-variant per food (`food:<id>`, no label or
 *  price) for orders that only recorded the food. */
async function loadOldVariants(db: Client): Promise<VariantInfo[]> {
  const foodEn = `(SELECT ft.name FROM "FoodTranslation" ft
    WHERE ft."foodId" = f.id AND ft.language = 'en' LIMIT 1)`;
  const { rows: variants } = await db.query(`
    SELECT v.id::text, v.label, v.price, f.name AS food, ${foodEn} AS food_en,
      c.name AS category
    FROM "FoodVariant" v
    JOIN "Food" f ON f.id = v."foodId"
    LEFT JOIN "Category" c ON c.id = f."categoryId"
  `);
  const { rows: foods } = await db.query(`
    SELECT 'food:' || f.id::text AS id, NULL AS label, NULL AS price,
      f.name AS food, ${foodEn} AS food_en, c.name AS category
    FROM "Food" f
    LEFT JOIN "Category" c ON c.id = f."categoryId"
  `);
  return [...variants, ...foods].map(toVariant);
}

async function loadCurrentVariants(db: Client): Promise<VariantInfo[]> {
  const { rows } = await db.query(`
    SELECT v.id, v.price, c.key AS category,
      (SELECT vt.label FROM food_variant_translation vt
        WHERE vt.variant_id = v.id ORDER BY vt.language = 'en' DESC LIMIT 1) AS label,
      (SELECT ft.name FROM food_translation ft
        WHERE ft.food_id = f.id ORDER BY ft.language = 'en' DESC LIMIT 1) AS food
    FROM food_variant v
    JOIN food f ON f.id = v.food_id
    JOIN category c ON c.id = f.category_id
  `);
  return rows.map(toVariant);
}

/** Recreates old menu items that have no current match as unavailable foods,
 *  which the guest menu filters out, so their orders still import. Keys are
 *  old variant ids, or `food:<id>` for orders that only recorded the food. */
async function hiddenMenu(oldDb: Client, newDb: Client, keys: string[]) {
  const prefix = `${LEGACY_EVENT.id}-`;
  const variantIds = keys.filter((k) => !k.startsWith('food:'));
  const foodOnlyIds = keys
    .filter((k) => k.startsWith('food:'))
    .map((k) => k.slice(5));

  const { rows: oldVariants } = await oldDb.query(
    `SELECT id::text, "foodId"::text AS food_id, label, price
     FROM "FoodVariant" WHERE id::text = ANY($1)`,
    [variantIds],
  );
  const foodIds = [
    ...new Set([...oldVariants.map((v) => v.food_id), ...foodOnlyIds]),
  ];
  const { rows: oldFoods } = await oldDb.query(
    `SELECT f.id::text, f.name, f.description, f."imageUrl" AS image_url,
       c.id::text AS category_id, c.name AS category
     FROM "Food" f JOIN "Category" c ON c.id = f."categoryId"
     WHERE f.id::text = ANY($1)`,
    [foodIds],
  );
  const { rows: oldTranslations } = await oldDb.query(
    `SELECT "foodId"::text AS food_id, language, name, description
     FROM "FoodTranslation" WHERE "foodId"::text = ANY($1)`,
    [foodIds],
  );
  const { rows: currentCategories } = await newDb.query(
    'SELECT id, key FROM category',
  );
  const { rows: languages } = await newDb.query('SELECT code FROM language');
  const languageCodes = new Set(languages.map((l) => l.code));

  const categoryByKey = new Map<string, string>(
    currentCategories.map((c) => [norm(c.key), c.id]),
  );
  const categories: Row[] = [];
  const categoryTranslations: Row[] = [];
  const foods: Row[] = [];
  const foodTranslations: Row[] = [];
  for (const f of oldFoods) {
    let categoryId = categoryByKey.get(norm(f.category));
    if (!categoryId) {
      categoryId = prefix + f.category_id;
      categoryByKey.set(norm(f.category), categoryId);
      categories.push({ id: categoryId, key: f.category, is_available: false });
      categoryTranslations.push({
        category_id: categoryId,
        language: 'en',
        name: fit(f.category, `category ${f.category_id}`),
      });
    }

    const foodId = prefix + f.id;
    foods.push({
      id: foodId,
      image_url: f.image_url?.length <= 500 ? f.image_url : null,
      category_id: categoryId,
      is_available: false,
    });
    const own = oldTranslations.filter(
      (t) => t.food_id === f.id && languageCodes.has(t.language),
    );
    if (!own.some((t) => t.language === 'en')) {
      own.push({ language: 'en', name: f.name, description: f.description });
    }
    for (const t of own) {
      foodTranslations.push({
        food_id: foodId,
        language: t.language,
        name: fit(t.name, `food ${f.id}`),
        description: t.description,
      });
    }
  }

  const mapping = new Map<string, string>();
  const variants: Row[] = [];
  const variantTranslations: Row[] = [];
  for (const v of oldVariants) {
    const id = prefix + v.id;
    mapping.set(v.id, id);
    variants.push({
      id,
      food_id: prefix + v.food_id,
      price: v.price,
      is_available: false,
    });
    if (v.label?.trim()) {
      variantTranslations.push({
        variant_id: id,
        language: 'en',
        label: fit(v.label.trim(), `variant ${v.id}`),
      });
    }
  }
  for (const foodId of foodOnlyIds) {
    const id = `${prefix}food-${foodId}`;
    mapping.set(`food:${foodId}`, id);
    variants.push({
      id,
      food_id: prefix + foodId,
      price: null,
      is_available: false,
    });
  }

  return {
    mapping,
    tables: [
      ['category', categories],
      ['category_translation', categoryTranslations],
      ['food', foods],
      ['food_translation', foodTranslations],
      ['food_variant', variants],
      ['food_variant_translation', variantTranslations],
    ] as [string, Row[]][],
  };
}

/** Matches old variants to current ones, loosening the key one step at a time
 *  and only accepting a step when it yields exactly one candidate. */
function matchVariants(oldVariants: VariantInfo[], current: VariantInfo[]) {
  const keys: ((v: VariantInfo, food: string) => string)[] = [
    (v, food) => [v.category, food, v.label, v.price].join('|'),
    (v, food) => [food, v.label, v.price].join('|'),
    (v, food) => [food, v.label].join('|'),
    (_, food) => food,
  ];
  const indexes = keys.map((key) => {
    const index = new Map<string, Set<string>>();
    for (const v of current) {
      for (const food of v.foods) {
        const k = key(v, food);
        index.set(k, (index.get(k) ?? new Set()).add(v.id));
      }
    }
    return index;
  });

  const mapping = new Map<string, string>();
  const unmatched: VariantInfo[] = [];
  for (const v of oldVariants) {
    const hit = keys
      .flatMap((key, i) => v.foods.map((food) => indexes[i].get(key(v, food))))
      .find((candidates) => candidates?.size === 1);
    if (hit) mapping.set(v.id, [...hit][0]);
    else unmatched.push(v);
  }
  return { mapping, unmatched };
}

async function inspect(url: string) {
  const db = new Client({ connectionString: url });
  await db.connect();
  try {
    const { rows: databases } = await db.query(
      'SELECT datname FROM pg_database WHERE NOT datistemplate ORDER BY 1',
    );
    console.log(
      `Databases on this server: ${databases.map((d) => d.datname).join(', ')}`,
    );

    const { rows: tables } = await db.query(`
      SELECT table_schema, table_name FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY 1, 2
    `);
    const counts = [];
    for (const t of tables) {
      const { rows } = await db.query(
        `SELECT count(*)::int AS n FROM "${t.table_schema}"."${t.table_name}"`,
      );
      counts.push({
        schema: t.table_schema,
        table: t.table_name,
        rows: rows[0].n,
      });
    }
    console.table(counts);

    if (counts.some((c) => c.table === 'Table')) {
      const { rows: breakdown } = await db.query(`
        SELECT left(t.id::text, 8) AS id, t.name, t."isStaging" AS staging,
          left(t."referenceId"::text, 8) AS ref,
          EXISTS (SELECT 1 FROM "Layout" l WHERE l."tableId" = t.id) AS layout,
          (SELECT count(*)::int FROM "People" p WHERE p."tableId" = t.id) AS people,
          (SELECT count(*)::int FROM "Order" o WHERE o."tableId" = t.id) AS orders,
          to_char(t."createdAt", 'YYYY-MM-DD HH24:MI') AS created
        FROM "Table" t ORDER BY t."createdAt"
      `);
      console.table(breakdown);
    }

    const { rows: cols } = await db.query(`
      SELECT table_schema, table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name, ordinal_position
    `);
    for (const t of tables) {
      const own = cols.filter(
        (c) =>
          c.table_schema === t.table_schema && c.table_name === t.table_name,
      );
      console.log(
        `\n${t.table_schema}.${t.table_name}\n` +
          own
            .map(
              (c) =>
                `  ${c.column_name}: ${c.data_type}${c.is_nullable === 'NO' ? '' : '?'}`,
            )
            .join('\n'),
      );
    }
  } finally {
    await db.end();
  }
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
          .join(', ')})`,
    );
    const res = await db.query(
      `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(', ')})
       VALUES ${values.join(', ')} ON CONFLICT DO NOTHING`,
      params,
    );
    inserted += res.rowCount ?? 0;
  }
  return inserted;
}

async function main() {
  const oldUrl = process.env.OLD_DATABASE_URL;
  const newUrl = process.env.DATABASE_URL;
  if (INSPECT && oldUrl) {
    await inspect(oldUrl);
    return;
  }
  if (!oldUrl || !newUrl) {
    throw new Error('Set OLD_DATABASE_URL and DATABASE_URL in backend/.env');
  }
  if (oldUrl === newUrl) {
    throw new Error(
      'OLD_DATABASE_URL and DATABASE_URL point at the same database',
    );
  }

  const oldDb = new Client({ connectionString: oldUrl });
  const newDb = new Client({ connectionString: newUrl });
  await oldDb.connect();
  await newDb.connect();

  try {
    const { rows: oldTables } = await oldDb.query(`
      SELECT id::text, name, capacity, "tableLeaderId"::text AS leader_id,
        "createdAt" AS created_at
      FROM "Table" WHERE NOT "isStaging" ORDER BY "createdAt", name
    `);
    const { rows: oldPeople } = await oldDb.query(`
      SELECT p.id::text, p.name, p."tableId"::text AS table_id FROM "People" p
      JOIN "Table" t ON t.id = p."tableId" AND NOT t."isStaging"
      ORDER BY p."createdAt"
    `);
    const { rows: oldOrders } = await oldDb.query(`
      SELECT o.id::text, o."tableId"::text AS table_id, o.quantity,
        COALESCE(o."variantId"::text, 'food:' || o."foodId"::text) AS variant_key,
        o."taggedPersonId"::text AS person_id,
        o."createdAt" AS created_at, o."updatedAt" AS updated_at, v.price
      FROM "Order" o
      JOIN "Table" t ON t.id = o."tableId" AND NOT t."isStaging"
      LEFT JOIN "FoodVariant" v ON v.id = o."variantId"
    `);

    // Leave out foods a previous run recreated, so re-runs match the same way.
    const currentVariants = (await loadCurrentVariants(newDb)).filter(
      (v) => !v.id.startsWith(`${LEGACY_EVENT.id}-`),
    );
    const currentPrice = new Map(currentVariants.map((v) => [v.id, v.price]));
    const oldVariants = await loadOldVariants(oldDb);
    const oldVariantByKey = new Map(oldVariants.map((v) => [v.id, v]));
    const { mapping: variantMap, unmatched } = matchVariants(
      oldVariants,
      currentVariants,
    );

    const missingQty = new Map<string, number>();
    for (const o of oldOrders.filter((o) => !variantMap.has(o.variant_key))) {
      missingQty.set(
        o.variant_key,
        (missingQty.get(o.variant_key) ?? 0) + o.quantity,
      );
    }
    const hidden = await hiddenMenu(oldDb, newDb, [...missingQty.keys()]);
    hidden.mapping.forEach((id, key) => variantMap.set(key, id));

    await newDb.query('BEGIN');

    const event = {
      id: LEGACY_EVENT.id,
      pin: generatePin(),
      name: LEGACY_EVENT.name,
      is_active: false,
      created_at: oldTables[0]?.created_at ?? new Date(),
    };

    // An old table takes the current active slot with the same name, if that
    // slot is still free in the legacy event. Otherwise it gets its own
    // inactive slot (kept off the floor plan) so its name survives.
    const { rows: slots } = await newDb.query(
      'SELECT id, no, name, is_active FROM table_slot',
    );
    const slotIds = new Set<string>(slots.map((s) => s.id));
    const usedNos = new Set<number>(slots.map((s) => s.no));
    const activeSlotByName = new Map<string, string>(
      slots.filter((s) => s.is_active).map((s) => [norm(s.name), s.id]),
    );
    const oldTableIds = new Set(oldTables.map((t) => t.id));
    const { rows: seated } = await newDb.query(
      'SELECT id, slot_id FROM "table" WHERE event_id = $1 AND slot_id IS NOT NULL',
      [LEGACY_EVENT.id],
    );
    const takenSlots = new Set<string>(
      seated.filter((t) => !oldTableIds.has(t.id)).map((t) => t.slot_id),
    );
    const existingSlotOf = new Map<string, string>(
      seated.map((t) => [t.id, t.slot_id]),
    );

    const newSlots: Row[] = [];
    const slotFor = (t: Row): string => {
      const existing = existingSlotOf.get(t.id);
      if (existing) return existing;
      const byName = activeSlotByName.get(norm(t.name));
      if (byName && !takenSlots.has(byName)) {
        takenSlots.add(byName);
        return byName;
      }
      const id = `${LEGACY_EVENT.id}-${t.id}`;
      if (!slotIds.has(id)) {
        let no = 1;
        while (usedNos.has(no)) no++;
        usedNos.add(no);
        slotIds.add(id);
        newSlots.push({
          id,
          no,
          name: fit(t.name, `table ${t.id}`),
          default_capacity: t.capacity,
          is_active: false,
        });
      }
      takenSlots.add(id);
      return id;
    };

    const peopleIds = new Set(oldPeople.map((p) => p.id));
    const usedLeaders = new Set<string>();
    const tables: Row[] = oldTables.map((t) => {
      const leader =
        peopleIds.has(t.leader_id) && !usedLeaders.has(t.leader_id)
          ? t.leader_id
          : null;
      if (leader) usedLeaders.add(leader);
      return {
        id: t.id,
        slot_id: slotFor(t),
        capacity: t.capacity,
        table_leader_id: leader,
        // Creating an event adopts every staging table, so none may come across as one.
        is_staging: false,
        event_id: LEGACY_EVENT.id,
        code: generatePin(),
      };
    });

    const people: Row[] = oldPeople.map((p) => ({
      id: p.id,
      name: fit(p.name, `person ${p.id}`, 25),
      table_id: oldTableIds.has(p.table_id) ? p.table_id : null,
      event_id: LEGACY_EVENT.id,
    }));

    const tableName = new Map(oldTables.map((t) => [t.id, t.name]));
    const unpriced: Row[] = [];
    const orders: Row[] = oldOrders
      .filter(
        (o) => oldTableIds.has(o.table_id) && variantMap.has(o.variant_key),
      )
      .map((o) => {
        const variantId = variantMap.get(o.variant_key);
        const price = o.price ?? (currentPrice.get(variantId) || null);
        if (price == null) {
          const v = oldVariantByKey.get(o.variant_key);
          unpriced.push({
            table: tableName.get(o.table_id),
            food: v?.foods.join(' / '),
            label: v?.label,
            qty: o.quantity,
            ordered: o.created_at,
          });
        }
        const tagged = peopleIds.has(o.person_id);
        return {
          id: o.id,
          table_id: o.table_id,
          variant_id: variantId,
          event_id: LEGACY_EVENT.id,
          quantity: o.quantity,
          price: price ?? 0,
          split_all: !tagged,
          updated_at: o.updated_at,
          created_at: o.created_at,
          person_id: tagged ? o.person_id : null,
        };
      });
    const splits: Row[] = orders
      .filter((o) => o.person_id)
      .map((o) => ({ order_id: o.id, person_id: o.person_id }));
    orders.forEach((o) => delete o.person_id);

    const hiddenSummary = [];
    for (const [table, rows] of hidden.tables) {
      hiddenSummary.push([
        `${table} (hidden)`,
        0,
        rows,
        await insert(newDb, table, rows),
      ]);
    }

    const summary = [
      ...hiddenSummary,
      ['event', 0, [event], await insert(newDb, 'event', [event])],
      ['table_slot', 0, newSlots, await insert(newDb, 'table_slot', newSlots)],
      ['table', oldTables.length, tables, await insert(newDb, 'table', tables)],
      [
        'people',
        oldPeople.length,
        people,
        await insert(newDb, 'people', people),
      ],
      ['order', oldOrders.length, orders, await insert(newDb, 'order', orders)],
      ['order_split', 0, splits, await insert(newDb, 'order_split', splits)],
    ].map(
      ([table, inOld, rows, inserted]: [string, number, Row[], number]) => ({
        table,
        'in old db': inOld,
        'to import': rows.length,
        inserted,
        'already there': rows.length - inserted,
      }),
    );
    console.table(summary);

    if (missingQty.size > 0) {
      console.warn(
        `! ${missingQty.size} old menu items had no unique match, recreated as hidden foods:`,
      );
      console.table(
        unmatched
          .filter((v) => missingQty.has(v.id))
          .map((v) => ({
            category: v.category,
            food: v.foods.join(' / '),
            label: v.label,
            price: v.price,
            qty: missingQty.get(v.id),
          })),
      );
    }
    const skipped = oldOrders.length - orders.length;
    if (skipped > 0) {
      console.warn(`! ${skipped} orders skipped: their table no longer exists`);
    }
    if (unpriced.length > 0) {
      console.warn(
        `! ${unpriced.length} orders had no price anywhere, imported at 0:`,
      );
      console.table(unpriced);
    }
    if (truncated.length > 0) {
      console.warn(
        `! ${truncated.length} names were over 255 characters and got cut:`,
      );
      truncated.forEach((t) => console.warn(`  ${t}`));
    }

    if (APPLY) {
      await newDb.query('COMMIT');
      console.log('✓ Committed');
    } else {
      await newDb.query('ROLLBACK');
      console.log('Dry run, nothing written. Re-run with --apply to commit.');
    }
  } catch (err) {
    await newDb.query('ROLLBACK').catch(() => undefined);
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
