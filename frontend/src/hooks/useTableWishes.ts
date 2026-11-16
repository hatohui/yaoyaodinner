import { useMemo } from 'react'
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
import type { TableWishDto, WishKind } from '@/api/model'
import type { CartDish } from '@/hooks/useOrderCart'
import { useToast } from '@/hooks/useToast'
import { TABLE_LIVE_REFETCH_MS } from '@/common/constants'

export type WishStatus = 'ordered' | 'in_cart' | 'open'

export type NewWish =
	| { kind: WishKind; variantId: string }
	| { kind: WishKind; label: string }

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

	const { mutate: create, isPending: isAdding } = useCreateTableWish({
		mutation: {
			onSuccess: wish =>
				qc.setQueryData<TableWishDto[]>(queryKey, prev => [
					...(prev ?? []),
					wish,
				]),
			onError: err =>
				toast.error(
					isAxiosError(err) && err.response?.status === 409
						? t('plan_board.duplicate')
						: t('plan_board.add_failed')
				),
		},
	})

	const { mutate: update } = useUpdateTableWish({
		mutation: {
			// a dropped wish should land at once, not after the round trip
			onMutate: ({ id, data }) =>
				qc.setQueryData<TableWishDto[]>(queryKey, prev =>
					(prev ?? []).map(w => (w.id === id ? { ...w, kind: data.kind } : w))
				),
			onSuccess: wish =>
				qc.setQueryData<TableWishDto[]>(queryKey, prev =>
					(prev ?? []).map(w => (w.id === wish.id ? wish : w))
				),
			onError: () => {
				toast.error(t('plan_board.save_failed'))
				refresh()
			},
		},
	})

	const { mutate: destroy } = useDeleteTableWish({
		mutation: {
			onMutate: ({ id }) =>
				qc.setQueryData<TableWishDto[]>(queryKey, prev =>
					(prev ?? []).filter(w => w.id !== id)
				),
			onError: () => {
				toast.error(t('plan_board.save_failed'))
				refresh()
			},
		},
	})

	return {
		wishes,
		isLoading,
		isAdding,
		add: (wish: NewWish) =>
			create({ data: { tableId, ...wish }, params: { lang: i18n.language } }),
		setKind: (id: string, kind: WishKind) =>
			update({ id, data: { kind }, params: { lang: i18n.language } }),
		remove: (id: string) => destroy({ id }),
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
		pick: (
			food: { id: string; defaultVariantId?: string | null },
			kind: WishKind
		) => {
			const wish = byFood.get(food.id)
			if (wish) board.setKind(wish.id, kind)
			else if (food.defaultVariantId)
				board.add({ kind, variantId: food.defaultVariantId })
		},
		removeFood: (foodId: string) => {
			const wish = byFood.get(foodId)
			if (wish) board.remove(wish.id)
		},
	}
}
