import type {
	Allergen,
	OrderResponseDto,
	PersonDto,
	TableWishDto,
} from '@/api/model'
import { dishKey } from '@/components/ordering/groupOrders'
import type { CartLine } from '@/hooks/useOrderCart'

export interface PersonalDish {
	key: string
	foodId: string
	name: string
	quantity: number
	people: string[]
	inCart: boolean
}

export interface AllergyGroup {
	key: string
	allergen: Allergen
	label: string | null
	people: string[]
}

const byName = (a: string, b: string) => a.localeCompare(b)

/**
 * Orders and cart lines that aren't shared by the whole table, folded per dish
 * with who has them. Cart lines stay separate so nobody mistakes them for placed.
 */
export function personalDishes(
	orders: OrderResponseDto[],
	cart: CartLine[],
	myPersonId: string | null,
	people: PersonDto[]
): PersonalDish[] {
	const names = new Map(people.map(p => [p.id, p.name]))
	const dishes = new Map<string, PersonalDish & { ids: Set<string> }>()
	for (const line of cart) {
		if (line.mode === 'table') continue
		const ids = line.mode === 'me' ? [myPersonId] : [...line.chosen]
		dishes.set(`cart:${line.foodId}`, {
			key: `cart:${line.foodId}`,
			foodId: line.foodId,
			name: line.name,
			quantity: line.quantity,
			people: [],
			inCart: true,
			ids: new Set(ids.filter((id): id is string => Boolean(id))),
		})
	}
	for (const order of orders) {
		if (order.splitAll) continue
		const key = dishKey(order)
		const name = order.variantLabel
			? `${order.foodName} (${order.variantLabel})`
			: order.foodName
		const dish = dishes.get(key) ?? {
			key,
			foodId: order.foodId,
			name,
			quantity: 0,
			people: [],
			inCart: false,
			ids: new Set<string>(),
		}
		dish.quantity += order.quantity
		for (const split of order.splits) dish.ids.add(split.personId)
		dishes.set(key, dish)
	}
	return [...dishes.values()]
		.map(({ ids, ...dish }) => ({
			...dish,
			people: [...ids]
				.map(id => names.get(id))
				.filter((n): n is string => Boolean(n))
				.sort(byName),
		}))
		.sort(
			(a, b) => Number(a.inCart) - Number(b.inCart) || byName(a.name, b.name)
		)
}

export function allergyGroups(people: PersonDto[]): AllergyGroup[] {
	const groups = new Map<string, AllergyGroup>()
	for (const person of people) {
		for (const a of person.allergies ?? []) {
			const label = a.label ?? null
			const key = `${a.allergen}:${label?.toLowerCase() ?? ''}`
			const group = groups.get(key) ?? {
				key,
				allergen: a.allergen,
				label,
				people: [],
			}
			group.people.push(person.name)
			groups.set(key, group)
		}
	}
	return [...groups.values()]
		.map(g => ({ ...g, people: g.people.sort(byName) }))
		.sort((a, b) => b.people.length - a.people.length)
}

interface PlanTextInput {
	headings: {
		must: string
		want: string
		avoid: string
		individual: string
		allergies: string
	}
	must: TableWishDto[]
	want: TableWishDto[]
	avoid: TableWishDto[]
	dishes: PersonalDish[]
	allergies: { label: string; people: string[] }[]
	whoFor: (wish: TableWishDto) => string[]
}

/** Plain text in the shape hosts already paste into the group chat. */
export function planText({
	headings,
	must,
	want,
	avoid,
	dishes,
	allergies,
	whoFor,
}: PlanTextInput) {
	const section = (title: string, lines: string[]) =>
		lines.length ? [`${title}:`, ...lines].join('\n') : null
	const wishLine = (w: TableWishDto) => {
		const name = w.variantLabel ? `${w.name} (${w.variantLabel})` : w.name
		const who = whoFor(w)
		return who.length ? `${name} - ${who.join(', ')}` : name
	}

	return [
		section(headings.must, must.map(wishLine)),
		section(headings.want, want.map(wishLine)),
		section(headings.avoid, avoid.map(wishLine)),
		section(
			headings.individual,
			dishes.map(d =>
				d.people.length
					? `${d.name} x${d.quantity} (${d.people.join(', ')})`
					: `${d.name} x${d.quantity}`
			)
		),
		section(
			headings.allergies,
			allergies.map(a => `${a.label} - ${a.people.join(', ')}`)
		),
	]
		.filter(Boolean)
		.join('\n\n')
}
