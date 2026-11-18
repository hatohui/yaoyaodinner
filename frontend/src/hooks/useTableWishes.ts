import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
	getGetTableWishesQueryKey,
	useCreateTableWish,
	useDeleteTableWish,
	useGetTableWishes,
	useUpdateTableWish,
} from '@/api/wishes/wishes'
import type {
	FoodItemDto,
	FoodVariantDto,
	TableWishDto,
	WishKind,
} from '@/api/model'
import type { CartDish } from '@/hooks/useOrderCart'
import { useToast } from '@/hooks/useToast'
import { TABLE_LIVE_REFETCH_MS } from '@/common/constants'

export type WishStatus = 'ordered' | 'in_cart' | 'open'

export type WishFood = Pick<
	FoodItemDto,
	'id' | 'name' | 'imageUrl' | 'price' | 'currency' | 'shouldCalculate'
>

/** `food` only feeds the instant preview row; the server fills in the rest. */
export type NewWish =
	| {
			kind: WishKind
			variantId: string
			food?: WishFood
			quantity?: number
			personIds?: string[]
	  }
	| {
			kind: WishKind
			label: string
			quantity?: number
			personIds?: string[]
	  }

const clampWishQuantity = (value: number) => Math.min(99, Math.max(1, value))

const draftWish = (
	id: string,
	tableId: string,
	wish: NewWish
): TableWishDto => {
	const food = 'variantId' in wish ? wish.food : undefined
	return {
		id,
		tableId,
		kind: wish.kind,
		variantId: 'variantId' in wish ? wish.variantId : null,
		foodId: food?.id ?? null,
		name: 'label' in wish ? wish.label : (food?.name ?? ''),
		variantLabel: null,
		foodImageUrl: food?.imageUrl ?? null,
		price: food?.price ?? null,
		currency: food?.currency ?? '',
		shouldCalculate: food?.shouldCalculate ?? true,
		personIds: wish.personIds ?? [],
		position: 0,
		quantity: clampWishQuantity(wish.quantity ?? 1),
		createdAt: new Date().toISOString(),
	}
}

/** Only menu dishes can go in the cart; free-text wishes stay a reminder. */
export const wishToCartDish = (wish: TableWishDto): CartDish | null =>
	wish.foodId && wish.variantId
		? {
				foodId: wish.foodId,
				variantId: wish.variantId,
				name: wish.name,
				imageUrl: wish.foodImageUrl ?? null,
				price: wish.price ?? 0,
				currency: wish.currency,
				shouldCalculate: wish.shouldCalculate,
			}
		: null

export function wishStatus(
	wish: TableWishDto,
	isOrdered: (foodId: string) => boolean,
	cartQuantityOf: (foodId: string) => number
): WishStatus {
	if (!wish.foodId) return 'open'
	if (isOrdered(wish.foodId)) return 'ordered'
	return cartQuantityOf(wish.foodId) > 0 ? 'in_cart' : 'open'
}

/** Must and want menu dishes not yet ordered. */
export const openPlanWishes = (
	wishes: TableWishDto[],
	statusOf: (wish: TableWishDto) => WishStatus
) =>
	wishes.filter(
		w =>
			w.kind !== 'avoid' && w.foodId && w.variantId && statusOf(w) !== 'ordered'
	)

export function useTableWishes(tableId: string) {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const params = { tableId, lang: i18n.language }
	const queryKey = getGetTableWishesQueryKey(params)

	const { data: wishes = [], isLoading } = useGetTableWishes<TableWishDto[]>(
		params,
		{
			query: {
				enabled: Boolean(tableId),
				refetchInterval: TABLE_LIVE_REFETCH_MS,
			},
		}
	)

	const refresh = () => qc.invalidateQueries({ queryKey })
	const patchCache = (fn: (prev: TableWishDto[]) => TableWishDto[]) =>
		qc.setQueryData<TableWishDto[]>(queryKey, prev => fn(prev ?? []))

	// edits made while a new wish is still saving wait here (null = removed)
	const drafts = useRef(
		new Map<
			string,
			{ kind: WishKind; position?: number; quantity?: number } | null
		>()
	)

	const reorderWishes = (
		prev: TableWishDto[],
		id: string,
		kind: WishKind,
		position?: number
	) => {
		const target = prev.find(w => w.id === id)
		if (!target) return prev
		const rest = prev.filter(w => w.id !== id)
		const inKind = rest.filter(w => w.kind === kind)
		const others = rest.filter(w => w.kind !== kind)
		const idx =
			position !== undefined
				? Math.max(0, Math.min(position, inKind.length))
				: inKind.length
		inKind.splice(idx, 0, { ...target, kind, position: idx })
		return [...others, ...inKind.map((w, i) => ({ ...w, position: i }))]
	}

	const { mutate: create } = useCreateTableWish()

	const { mutate: update } = useUpdateTableWish({
		mutation: {
			// a dropped wish should land at once, not after the round trip
			onMutate: ({ id, data }) =>
				(data.kind !== undefined || data.position !== undefined) &&
				patchCache(prev =>
					reorderWishes(
						prev,
						id,
						data.kind ?? prev.find(w => w.id === id)?.kind ?? 'want',
						data.position
					)
				),
			onSuccess: wish =>
				patchCache(prev =>
					prev.map(w =>
						w.id === wish.id
							? { ...wish, quantity: wish.quantity ?? w.quantity ?? 1 }
							: w
					)
				),
			onError: (err, vars) => {
				// older backends without `quantity` on UpdateTableWishDto return 400
				if (
					vars.data.quantity !== undefined &&
					Object.keys(vars.data).length === 1 &&
					isAxiosError(err) &&
					err.response?.status === 400
				) {
					return
				}
				toast.error(
					isAxiosError(err) && err.response?.status === 409
						? t('plan_board.duplicate')
						: t('plan_board.save_failed')
				)
				refresh()
			},
		},
	})

	const { mutate: destroy } = useDeleteTableWish({
		mutation: {
			onMutate: ({ id }) => patchCache(prev => prev.filter(w => w.id !== id)),
			onError: () => {
				toast.error(t('plan_board.save_failed'))
				refresh()
			},
		},
	})

	const add = (wish: NewWish) => {
		const draftId = `draft-${crypto.randomUUID()}`
		drafts.current.set(draftId, { kind: wish.kind })
		void qc.cancelQueries({ queryKey })
		patchCache(prev => [...prev, draftWish(draftId, tableId, wish)])

		const data =
			'variantId' in wish
				? { tableId, kind: wish.kind, variantId: wish.variantId }
				: { tableId, kind: wish.kind, label: wish.label }
		create(
			{ data, params: { lang: i18n.language } },
			{
				onSuccess: saved => {
					const pending = drafts.current.get(draftId)
					drafts.current.delete(draftId)
					if (pending === null) return destroy({ id: saved.id })
					const initialQty = clampWishQuantity(wish.quantity ?? 1)
					const savedWithDraft: TableWishDto = {
						...saved,
						quantity: saved.quantity ?? initialQty,
						personIds:
							saved.personIds.length > 0
								? saved.personIds
								: (wish.personIds ?? []),
					}
					patchCache(prev => {
						const rest = prev.filter(w => w.id !== saved.id)
						return rest.some(w => w.id === draftId)
							? rest.map(w => (w.id === draftId ? savedWithDraft : w))
							: [...rest, savedWithDraft]
					})
					if (
						pending &&
						(pending.kind !== saved.kind || pending.position !== undefined)
					) {
						moveWish(saved.id, pending.kind, pending.position)
					}
					if (wish.personIds?.length) {
						setPeople(saved.id, wish.personIds)
					}
					const targetQty = pending?.quantity ?? initialQty
					if (targetQty > 1) {
						setQuantity(saved.id, targetQty)
					}
				},
				onError: err => {
					drafts.current.delete(draftId)
					patchCache(prev => prev.filter(w => w.id !== draftId))
					toast.error(
						isAxiosError(err) && err.response?.status === 409
							? t('plan_board.duplicate')
							: t('plan_board.add_failed')
					)
				},
			}
		)
	}

	const moveWish = (id: string, kind: WishKind, position?: number) => {
		if (!drafts.current.has(id))
			return update({
				id,
				data: { kind, ...(position !== undefined ? { position } : {}) },
				params: { lang: i18n.language },
			})
		drafts.current.set(id, { kind, position })
		patchCache(prev => reorderWishes(prev, id, kind, position))
	}

	const setKind = (id: string, kind: WishKind) => moveWish(id, kind)

	const setVariant = (id: string, variant: FoodVariantDto) => {
		if (drafts.current.has(id)) return
		patchCache(prev =>
			prev.map(w =>
				w.id === id
					? {
							...w,
							variantId: variant.id,
							variantLabel: variant.label || null,
							price: variant.price,
							currency: variant.currency,
						}
					: w
			)
		)
		update({
			id,
			data: { variantId: variant.id },
			params: { lang: i18n.language },
		})
	}

	const setPeople = (id: string, personIds: string[]) => {
		if (drafts.current.has(id)) return
		patchCache(prev => prev.map(w => (w.id === id ? { ...w, personIds } : w)))
		update({ id, data: { personIds }, params: { lang: i18n.language } })
	}

	const setQuantity = (id: string, quantity: number) => {
		const next = clampWishQuantity(quantity)
		patchCache(prev =>
			prev.map(w => (w.id === id ? { ...w, quantity: next } : w))
		)
		if (drafts.current.has(id)) {
			const pending = drafts.current.get(id)
			if (pending) drafts.current.set(id, { ...pending, quantity: next })
			return
		}
		update({ id, data: { quantity: next }, params: { lang: i18n.language } })
	}

	const remove = (id: string) => {
		if (!drafts.current.has(id)) return destroy({ id })
		drafts.current.set(id, null)
		patchCache(prev => prev.filter(w => w.id !== id))
	}

	return {
		wishes,
		isLoading,
		add,
		setKind,
		moveWish,
		setVariant,
		setPeople,
		setQuantity,
		remove,
		/** Latest list, for callbacks that outlive the render they came from. */
		snapshot: () => qc.getQueryData<TableWishDto[]>(queryKey) ?? [],
	}
}

/** Plan actions keyed by dish, for menus that show one card per food. */
export function useFoodWishes(tableId: string) {
	const board = useTableWishes(tableId)
	const byFood = useMemo(
		() =>
			new Map(
				board.wishes.filter(w => w.foodId).map(w => [w.foodId as string, w])
			),
		[board.wishes]
	)

	return {
		wishes: board.wishes,
		wishOf: (foodId: string) => byFood.get(foodId),
		setVariant: board.setVariant,
		pick: (food: FoodItemDto, kind: WishKind) => {
			const wish = board.snapshot().find(w => w.foodId === food.id)
			if (wish) board.setKind(wish.id, kind)
			else if (food.defaultVariantId)
				board.add({ kind, variantId: food.defaultVariantId, food })
		},
		addConfigured: (
			food: FoodItemDto,
			variantId: string,
			kind: WishKind,
			quantity: number,
			personIds: string[]
		) => {
			const existing = board.snapshot().find(w => w.foodId === food.id)
			if (existing) {
				if (existing.kind !== kind) board.setKind(existing.id, kind)
				if (existing.variantId !== variantId) {
					board.setVariant(existing.id, {
						id: variantId,
						foodId: food.id,
						label: '',
						price: food.price ?? null,
						currency: food.currency ?? '',
						isAvailable: food.isAvailable,
						isSeasonal: false,
						sortOrder: 0,
					})
				}
				board.setPeople(existing.id, personIds)
				board.setQuantity(existing.id, quantity)
				return
			}
			board.add({ kind, variantId, food, quantity, personIds })
		},
		removeFood: (foodId: string) => {
			const wish = byFood.get(foodId)
			if (wish) board.remove(wish.id)
		},
	}
}
