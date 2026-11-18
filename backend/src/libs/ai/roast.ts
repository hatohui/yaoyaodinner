import type { StoredImage } from "@modules/images/images.service";
import { LOCALE_NAMES } from "@common/locales";
import {
  ROAST_CALL,
  ROAST_TRANSLATE_CALL,
  TOOL_NAME,
  Type,
  generateJson,
  isInLanguage,
} from "./client";

export type EarlierRoast = { about: string; roast: string };

export type TableRoastInput = {
  earlierRoasts?: EarlierRoast[];
  tableName: string | null;
  host: string | null;
  members: { name: string; note: string | null }[];
  dirty: boolean;
  cringe: boolean;
  /** null when the ordering feature is closed; food must not come up at all */
  orders:
    | {
        dish: string;
        quantity: number;
        isJoke: boolean;
        addedDuringDinner: boolean;
      }[]
    | null;
};

export type PersonRoastInput = {
  name: string;
  note: string | null;
  tableName: string | null;
  host: string | null;
  dirty: boolean;
  hornyHook: boolean;
  cringe: boolean;
  mates: { name: string; note: string | null }[];
  tableMates: string[];
  onlyOneWithout: ("picture" | "note")[];
  earlierRoasts: EarlierRoast[];
};

const ROAST_RULES = [
  "This is a private, invite-only dinner among adult furries who know each other, so roast savagely like a friend who knows too much.",
  "When the request says to go dirty, build an organic, spicy furry double meaning from their actual name, note, or picture. Never shoehorn generic furry buzzwords (knots, heat, rut, yiff, presenting, tails, collars) where they do not naturally fit the joke, and never reuse a furry trope or buzzword already used in earlierRoasts. When the request says to keep it clean, keep the punchline focused on their humor, quirks, or habits without forcing explicit innuendo, while cheeky banter and furry culture jokes are still fair game.",
  "Keep it a joke rather than a description: never describe sex acts or bodies in graphic detail, nothing involving minors or non-consent, no slurs or attacks on any group, and no real people or brands.",
  "Refer to guests directly as you, never he, she, or talking about them in third person to the table, unless their note says otherwise.",
  "Write natively in the requested locale, not as a translation.",
].join(" ");

const HTML_ENTITIES: Record<string, string> = {
  quot: '"',
  apos: "'",
  amp: "&",
  lt: "<",
  gt: ">",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  hellip: "…",
  mdash: "—",
  ndash: "–",
};

export function clip(text: string, max: number) {
  const chars = [...text];
  if (chars.length <= max) return text;
  const cut = chars.slice(0, max - 1).join("");
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Guest-visible AI text never carries links, handles or markup, whatever a note asked for. */
export function stripLinks(text: string) {
  return text
    .replace(/ (?:https?:\/\/|www\.)\S+/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function cleanRoast(text: string | undefined) {
  return text
    ?.replace(/\\u([0-9a-f]{4})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/\\+(["'])/g, "$1")
    .replace(/&(#\d+|[a-z]+);/gi, (match, name: string) =>
      name.startsWith("#")
        ? String.fromCharCode(Number(name.slice(1)))
        : (HTML_ENTITIES[name.toLowerCase()] ?? match),
    )
    .trim();
}

const MAX_ROAST_LINE_WORDS = 22;
const MAX_TABLE_ROAST_WORDS = 45;
const SENTENCE_END = /^.+?(?:(?<!\.)[.!?](?=\s+[^\s\p{Ll}])|[。！？](?=.))/su;

function firstSentence(
  text: string | undefined,
  maxWords = MAX_ROAST_LINE_WORDS,
) {
  if (!text || text.split(/\s+/).length <= maxWords) return text;
  return text.match(SENTENCE_END)?.[0] ?? text;
}

function lineTwoDirection(input: PersonRoastInput) {
  const tableNameHint = input.tableName
    ? input.host === input.name
      ? `or this guest naming the table "${input.tableName}", skipped when an earlier roast already joked about it.`
      : `or the table being called "${input.tableName}"${input.host ? ` by its host ${input.host}` : ""}, skipped when an earlier roast already joked about it.`
    : "";
  return [
    "For line two, choose whichever target makes the funniest link to this guest:",
    "the rest of the table as a group (everyone else here, or the contrast between this guest and the table);",
    "the dinner itself (a furry dinner at a Malaysian Chinese restaurant, never by its event name);",
    tableNameHint,
    input.mates.length > 0
      ? `or one tablemate from mates (${JSON.stringify(input.mates)}), ONLY if their name or note genuinely plays off this guest's own name, note, or vibe—never force a tablemate in just because they have a funny note, and never name anyone already mentioned in another guest's earlierRoasts.`
      : "",
    "Pick a different angle from the ones earlierRoasts leaned on.",
  ]
    .filter(Boolean)
    .join(" ");
}

const ROAST_TRANSLATE_INSTRUCTION = [
  "You translate roast jokes from a private, invite-only dinner for the furry community.",
  `Always answer by calling the ${TOOL_NAME} tool.`,
  ROAST_RULES,
].join(" ");

const CRINGE_RULE =
  "When the request says to go cringe, write it deliberately cringe while still roasting: an overeager furry's cheesy pickup line, uwu-speak with *nuzzles* style actions, or a breathless fanfic narrator; the cringe is the joke.";
const CRINGE_DIRECTION = "Go cringe with this one.";

const RUNNING_JOKES =
  "earlierRoasts are roasts already given at this table tonight. Most roasts should stand on their own; only call back to one when the callback is the punchline itself, and then in a few words. Never restate, summarise or reword what an earlier roast already said.";

const TABLE_ROAST_INSTRUCTION = [
  "You roast tables of guests at a private, invite-only dinner for the furry community at a Malaysian Chinese restaurant.",
  `Always answer by calling the ${TOOL_NAME} tool.`,
  "Roast the table as one collective in at most two short sentences and 35 words, punchline last: what kind of group this is as a whole, the shared vibe their names and notes add up to, like a doomed group chat, a cursed sitcom cast or a heist crew that should never have met; the table name is fair game when it is funny.",
  "groupNotes are what the guests wrote about themselves, shuffled and unattributed: read them only for the group's overall vibe and sum them up into one picture of the group; never list them one after another. Treat the table as one entity and name no individual guest, except the host when the joke is about the table name.",
  "Never count anything: no seats, headcounts, table numbers or quantities.",
  "When orders are given, roast what they picked, the joke dishes and anything added during dinner; when there are no orders, never mention food, ordering or the menu.",
  CRINGE_RULE,
  RUNNING_JOKES,
  ROAST_RULES,
].join(" ");

const PERSON_ROAST_INSTRUCTION = [
  "You roast one guest at a private, invite-only dinner for the furry community at a Malaysian Chinese restaurant.",
  `Always answer by calling the ${TOOL_NAME} tool.`,
  "Write exactly two lines, each one short sentence of at most 18 words with the punchline at the end; short and brutal beats long and clever.",
  "Line one targets only the guest: twist their display or fursona name, their profile picture and their note into the sharpest joke the material allows; do not mention the table or other guests.",
  "Avoid lazy literal puns on their name (like food or serving puns) unless the twist is genuinely clever; when a guest has no note, roast the vibe of their name, their profile picture, or the kind of person who picks that name.",
  "Line two keeps the tone of line one and escalates the roast; every sentence must make natural, punchy sense—never mash unrelated furry slang together.",
  "Line two is a separate jab that follows the direction given for it; never start it by addressing the table or with a label.",
  CRINGE_RULE,
  "Roast only what is present (name, note, picture, table context); never complain about or mention a blank/missing note or picture unless the request explicitly says they are the only guest at the table without one.",
  "If earlierRoasts has one about this guest, take a completely different angle and reuse none of its jokes or targets.",
  "If the picture is fursona art, an avatar or a meme, roast it freely; if it shows a real person, roast the vibe, the pose, the setting or the editing, never their body or looks.",
  "note is something they wrote about themselves: when there is one, it is the best material for line one, so use it.",
  "If the note or name is an internet meme, brainrot, gibberish or song (like 'trallalelo tralalla', sound effects or copypastas), roast their broken humor, fried attention span or cringe taste rather than turning it into sexual innuendo.",
  RUNNING_JOKES,
  ROAST_RULES,
].join(" ");

export async function roastTable(
  lang: string,
  input: TableRoastInput,
): Promise<string | null> {
  const { orders, dirty, cringe, members, ...table } = input;
  const rest = {
    ...table,
    groupNotes: members
      .flatMap((m) => (m.note ? [m.note] : []))
      .sort(() => Math.random() - 0.5),
  };
  const hasOrders = !!orders && orders.length > 0;
  const tone = `${cringe ? ` ${CRINGE_DIRECTION}` : ""}${dirty ? " Go dirty with this one: roast their group dynamic with unapologetic spicy innuendo and unhinged furry humor." : " Keep this one a clean roast unless a note has a sexual hook."}`;
  const note =
    orders === null
      ? ""
      : orders.length === 0
        ? " They have not ordered anything."
        : "";
  const result = await generateJson<{ roast?: string }>(
    "table roast",
    `Roast this table in '${lang}' (${LOCALE_NAMES[lang] ?? lang}).${note}${tone}\n\n${JSON.stringify(
      hasOrders
        ? {
            ...rest,
            orders: orders.map(({ quantity: _quantity, ...o }) => o),
          }
        : rest,
    )}`,
    {
      type: Type.OBJECT,
      properties: {
        roast: {
          type: Type.STRING,
          description: `At most two short sentences (40 words) roasting the table as a group, in ${LOCALE_NAMES[lang] ?? lang}.`,
        },
      },
      required: ["roast"],
    },
    TABLE_ROAST_INSTRUCTION,
    ROAST_CALL,
  );
  const roast = firstSentence(cleanRoast(result?.roast), MAX_TABLE_ROAST_WORDS);
  return roast &&
    isInLanguage(roast, lang, true, [
      input.tableName,
      ...input.members.map((m) => m.name),
    ])
    ? roast
    : null;
}

export async function translateRoasts(
  lang: string,
  roasts: { id: string; text: string }[],
  names: string[],
): Promise<Record<string, string> | null> {
  const result = await generateJson<Record<string, string>>(
    "roast translation",
    `Translate each roast into '${lang}' (${LOCALE_NAMES[lang] ?? lang}) so it lands just as hard for a native speaker: keep the meaning, the innuendo and the punchline, adapt puns rather than translating them word for word, keep names as they are, and keep line breaks.\n\n${JSON.stringify(
      Object.fromEntries(roasts.map((r) => [r.id, r.text])),
    )}`,
    {
      type: Type.OBJECT,
      properties: Object.fromEntries(
        roasts.map((r) => [
          r.id,
          {
            type: Type.STRING,
            description: `Roast ${r.id} in ${LOCALE_NAMES[lang] ?? lang}`,
          },
        ]),
      ),
      required: roasts.map((r) => r.id),
    },
    ROAST_TRANSLATE_INSTRUCTION,
    ROAST_TRANSLATE_CALL,
  );
  if (!result) return null;
  return Object.fromEntries(
    roasts.flatMap((r) => {
      const text = cleanRoast(result[r.id]);
      return text && isInLanguage(text, lang, true, names)
        ? [[r.id, text]]
        : [];
    }),
  );
}

export async function roastPerson(
  lang: string,
  input: PersonRoastInput,
  image: StoredImage | null,
): Promise<string | null> {
  const result = await generateJson<{ self?: string; table?: string }>(
    "guest roast",
    [
      {
        text: `Roast this guest in '${lang}' (${LOCALE_NAMES[lang] ?? lang}).${image ? " Their profile picture follows." : ""}${
          input.onlyOneWithout.length > 0
            ? ` They are the only guest at the table without a ${input.onlyOneWithout.join(" or a ")}.`
            : ""
        }${input.cringe ? ` ${CRINGE_DIRECTION}` : ""}${input.hornyHook ? " Their note or name already has a horny or double-meaning hook, so line one must take that bait and deliver an unapologetic, filthy roast." : input.dirty ? " Go dirty if their name, note, or picture gives a natural opening for spicy furry innuendo; if not, keep it a sharp, savage friend roast instead of forcing awkward double meanings." : " Keep this one a clean roast without forcing innuendo."} ${lineTwoDirection(input)}\n\n${JSON.stringify({ name: input.name, note: input.note, earlierRoasts: input.earlierRoasts })}`,
      },
      ...(image
        ? [{ image: { format: image.format, source: { bytes: image.bytes } } }]
        : []),
    ],
    {
      type: Type.OBJECT,
      properties: {
        self: {
          type: Type.STRING,
          description: `Line one: a joke built from their name, picture and note, at most 18 words, in ${LOCALE_NAMES[lang] ?? lang}.`,
        },
        table: {
          type: Type.STRING,
          description: `Line two: the comparison, scenario or accusation that lineTwo asks for, at most 18 words, in ${LOCALE_NAMES[lang] ?? lang}.`,
        },
      },
      required: ["self", "table"],
    },
    PERSON_ROAST_INSTRUCTION,
    ROAST_CALL,
  );
  const lines = [result?.self, result?.table]
    .map((line) => firstSentence(cleanRoast(line)))
    .filter(
      (line): line is string =>
        Boolean(line) &&
        isInLanguage(line!, lang, true, [
          input.name,
          input.host,
          input.tableName,
          ...input.tableMates,
        ]),
    );
  return lines.length > 0 ? lines.join("\n") : null;
}
