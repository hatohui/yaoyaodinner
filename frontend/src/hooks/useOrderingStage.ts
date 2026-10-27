import { useGetOrderingStatus } from '@/api/ordering/ordering'
import type { OrderingStatusDto, OrderResponseDto } from '@/api/model'
import { useIsAdmin } from '@/hooks/useIsAdmin'

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
	const { isAdmin } = useIsAdmin()
	const { data } = useGetOrderingStatus<OrderingStatusDto>({
		// the stage moves on its own at the deadline and dinner time
		query: { staleTime: 60_000, refetchInterval: 60_000 },
	})
	const status = data ?? FALLBACK
	const { stage } = status
	const finalized = stage === 'finalized'

	const roundOpen = (order: Pick<OrderResponseDto, 'round'>) =>
		order.round === 'pre' ? stage === 'open' : stage === 'dinner'

	return {
		...status,
		canAdd: stage === 'open' || stage === 'dinner',
		canSplit: !finalized,
		canChangeItems: (order: Pick<OrderResponseDto, 'round'>) =>
			isAdmin ? !finalized : roundOpen(order),
		canEditPrice: (order: Pick<OrderResponseDto, 'round'>) =>
			isAdmin
				? !finalized
				: order.round === 'dinner' &&
					stage === 'dinner' &&
					status.dinnerPriceEditable,
	}
}
