import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { useGetCategories } from '@/api/categories/categories'
import { useGetTablePeople } from '@/api/tables/tables'
import type { Allergen, CategoryItemDto, PersonDto } from '@/api/model'
import { useTableWishes } from '@/hooks/useTableWishes'
import { MENU_EXCLUDE_STORAGE_KEY, STALE_TIME_STATIC } from '@/common/constants'
import { localStorage } from '@/utils/localstorage'

/**
 * Menu categories that clearly contain an allergen, matched on the category key.
 * Allergens that cut across the menu (gluten, dairy...) have no safe category to drop.
 */
const SHELLFISH = ['prawn', 'crab', 'la-la', 'squid', 'shark fin & abalone']
const MEAT_AND_SEAFOOD = ['pork', 'chicken', 'fish', ...SHELLFISH]
const ALLERGEN_CATEGORIES: Partial<Record<Allergen, string[]>> = {
	shellfish: SHELLFISH,
	fish: ['fish', 'shark fin & abalone'],
	pork: ['pork'],
	egg: ['egg'],
	soy: ['bean curd'],
	vegetarian: MEAT_AND_SEAFOOD,
}

interface ExcludeState {
	categories: string[]
	hideAvoided: boolean
	setCategories: (ids: string[]) => void
	toggleCategory: (id: string) => void
	setHideAvoided: (hide: boolean) => void
	clear: () => void
}

type StoredExclude = Pick<ExcludeState, 'categories' | 'hideAvoided'>

const loadStored = (): StoredExclude => {
	try {
		const raw = localStorage.load(MENU_EXCLUDE_STORAGE_KEY)
		const parsed = raw ? (JSON.parse(raw) as Partial<StoredExclude>) : {}
		return {
			categories: Array.isArray(parsed.categories) ? parsed.categories : [],
			hideAvoided: parsed.hideAvoided ?? true,
		}
	} catch {
		return { categories: [], hideAvoided: true }
	}
}

// shared by the menu and the order page, and kept on the device: allergies don't change between visits
export const useExcludeStore = create<ExcludeState>(set => ({
	...loadStored(),
	setCategories: ids => set({ categories: [...new Set(ids)] }),
	toggleCategory: id =>
		set(s => ({
			categories: s.categories.includes(id)
				? s.categories.filter(c => c !== id)
				: [...s.categories, id],
		})),
	setHideAvoided: hideAvoided => set({ hideAvoided }),
	clear: () => set({ categories: [] }),
}))

useExcludeStore.subscribe(({ categories, hideAvoided }) =>
	localStorage.save(
		MENU_EXCLUDE_STORAGE_KEY,
		JSON.stringify({ categories, hideAvoided })
	)
)

export interface AllergyShortcut {
	allergens: Allergen[]
	categoryIds: string[]
	unmatched: Allergen[]
}

function allergyShortcut(
	people: PersonDto[],
	categories: CategoryItemDto[]
): AllergyShortcut | null {
	const allergens = [
		...new Set(people.flatMap(p => (p.allergies ?? []).map(a => a.allergen))),
	]
	if (allergens.length === 0) return null
	const byKey = new Map(categories.map(c => [c.key.toLowerCase(), c.id]))
	const categoryIds = new Set<string>()
	const unmatched: Allergen[] = []
	for (const allergen of allergens) {
		const ids = (ALLERGEN_CATEGORIES[allergen] ?? [])
			.map(key => byKey.get(key))
			.filter((id): id is string => Boolean(id))
		if (ids.length === 0) unmatched.push(allergen)
		ids.forEach(id => categoryIds.add(id))
	}
	return { allergens, categoryIds: [...categoryIds], unmatched }
}

/** What to leave out of the menu, plus the table context the filter offers shortcuts from. */
export function useExcludeFilter(tableId: string) {
	const { i18n } = useTranslation()
	const state = useExcludeStore()
	const { data: categories = [] } = useGetCategories<CategoryItemDto[]>(
		{ lang: i18n.language },
		{ query: { staleTime: STALE_TIME_STATIC } }
	)
	const { data: people = [] } = useGetTablePeople<PersonDto[]>(tableId, {
		query: { enabled: Boolean(tableId) },
	})
	const { wishes } = useTableWishes(tableId)

	const avoidedFoods = useMemo(
		() =>
			wishes
				.filter(w => w.kind === 'avoid' && w.foodId)
				.map(w => w.foodId as string),
		[wishes]
	)
	const shortcut = useMemo(
		() => allergyShortcut(people, categories),
		[people, categories]
	)
	const foods = state.hideAvoided ? avoidedFoods : []

	return {
		...state,
		allCategories: categories,
		shortcut,
		avoidedCount: avoidedFoods.length,
		activeCount: state.categories.length + foods.length,
		query: {
			excludeCategories: state.categories.length
				? [...state.categories].sort().join(',')
				: undefined,
			excludeFoods: foods.length ? [...foods].sort().join(',') : undefined,
		},
	}
}

export type ExcludeFilterState = ReturnType<typeof useExcludeFilter>
