import { useGetOrderingStatus } from '@/api/ordering/ordering'
import type { OrderingStatusDto, OrderResponseDto } from '@/api/model'
import { useEditMode } from '@/hooks/useEditMode'

const FALLBACK: OrderingStatusDto = {
	stage: 'closed',
	timezone: 'Asia/Kuala_Lumpur',
	deadline: null,
	dinnerTime: null,
	autoConfirm: true,
	dinnerPriceEditable: true,
}

/** Mirrors the server's rules so locked controls are hidden, not just rejected. */
export function useOrderingStage() {
	const { editing } = useEditMode()
	const { data, isLoading } = useGetOrderingStatus<OrderingStatusDto>({
		// the stage moves on its own at the deadline and dinner time
		query: {
			staleTime: 60_000,
			refetchInterval: 60_000,
			retry: false,
			meta: { silent: true },
		},
	})
	const status = data ?? FALLBACK
	const { stage } = status
	const finalized = stage === 'finalized'

	const roundOpen = (order: Pick<OrderResponseDto, 'round'>) =>
		order.round === 'pre' ? stage === 'open' : stage === 'dinner'

	return {
		...status,
		isLoading,
		canAdd: stage === 'open' || stage === 'dinner',
		canSplit: !finalized,
		canChangeItems: (order: Pick<OrderResponseDto, 'round'>) =>
			editing ? !finalized : roundOpen(order),
		canEditPrice: (order: Pick<OrderResponseDto, 'round'>) =>
			editing
				? !finalized
				: order.round === 'dinner' &&
					stage === 'dinner' &&
					status.dinnerPriceEditable,
	}
}
