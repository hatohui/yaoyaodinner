import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useGetOrders,
	useUpdateOrder,
	useDeleteOrder,
	getGetOrdersQueryKey,
} from '@/api/orders/orders'
import { useToast } from '@/hooks/useToast'
import type { OrderResponseDto } from '@/api/model'

export function useOrders(tableId: string) {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const ordersKey = getGetOrdersQueryKey({ tableId, lang: i18n.language })

	const { data, isLoading } = useGetOrders<OrderResponseDto[]>({
		tableId,
		lang: i18n.language,
	})

	const invalidate = () => qc.invalidateQueries({ queryKey: ordersKey })

	const updateMutation = useUpdateOrder({
		mutation: {
			onMutate: async ({ id, data: body }) => {
				await qc.cancelQueries({ queryKey: ordersKey })
				const prev = qc.getQueryData<OrderResponseDto[]>(ordersKey)
				qc.setQueryData<OrderResponseDto[]>(ordersKey, old =>
					(old ?? []).map(o =>
						o.id === id
							? {
									...o,
									quantity: body.quantity ?? o.quantity,
									splitAll: body.splitAll ?? o.splitAll,
									splits:
										body.personIds !== undefined
											? body.personIds.map(personId => ({ personId }))
											: o.splits,
								}
							: o
					)
				)
				return { prev }
			},
			onError: (_e, _v, ctx) => {
				qc.setQueryData(ordersKey, ctx?.prev)
				toast.error(t('orders.update_failed'))
			},
			onSettled: invalidate,
		},
	})

	const removeMutation = useDeleteOrder({
		mutation: {
			onMutate: async ({ id }) => {
				await qc.cancelQueries({ queryKey: ordersKey })
				const prev = qc.getQueryData<OrderResponseDto[]>(ordersKey)
				qc.setQueryData<OrderResponseDto[]>(ordersKey, old =>
					(old ?? []).filter(o => o.id !== id)
				)
				return { prev }
			},
			onError: (_e, _v, ctx) => {
				qc.setQueryData(ordersKey, ctx?.prev)
				toast.error(t('orders.remove_failed'))
			},
			onSettled: invalidate,
		},
	})

	const remove = (id: string) => removeMutation.mutate({ id })

	/**
	 * Edits a grouped line: the change lands on its first order and any
	 * duplicates are deleted, so older repeat rows fold into one as people edit.
	 */
	const updateLine = (
		ids: string[],
		data: { quantity: number; splitAll?: boolean; personIds?: string[] }
	) => {
		if (data.quantity < 1) return
		const [primary, ...duplicates] = ids
		updateMutation.mutate({ id: primary, data })
		duplicates.forEach(remove)
	}

	const removeLine = (ids: string[]) => ids.forEach(remove)

	const orders = data ?? []
	const total = orders.reduce(
		(sum, o) => (o.shouldCalculate ? sum + o.price * o.quantity : sum),
		0
	)

	return { orders, isLoading, total, updateLine, removeLine }
}
