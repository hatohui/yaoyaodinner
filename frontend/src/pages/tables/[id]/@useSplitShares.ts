import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getGetOrdersQueryOptions } from '@/api/orders/orders'
import { getGetPresetMenusQueryOptions } from '@/api/preset-menus/preset-menus'
import type {
	OrderResponseDto,
	PersonDto,
	PresetMenuDto,
	TableDto,
} from '@/api/model'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { allocateCents, billingCurrency, hasUnpriced } from '@/utils/money'
import type { SplitRound } from './@SplitBreakdown'

/** What each person at the table owes, rounded so the shares add up to the total. */
export function useSplitShares(
	table: Pick<TableDto, 'id' | 'eventId'>,
	people: PersonDto[],
	enabled = true
) {
	const { t, i18n } = useTranslation()
	const { personId: myPersonId } = useWhoAmI(table.id)

	const { data: orders = [], isLoading: ordersLoading } = useQuery({
		...getGetOrdersQueryOptions<OrderResponseDto[]>({
			tableId: table.id,
			lang: i18n.language,
		}),
		enabled,
	})
	const { data: presets = [], isLoading: presetsLoading } = useQuery({
		...getGetPresetMenusQueryOptions<PresetMenuDto[]>({
			lang: i18n.language,
			eventId: table.eventId ?? undefined,
		}),
		enabled,
	})

	const activePreset = presets.find(p => p.isActive)
	const flatPrice = activePreset?.price ?? 0
	const flatShare = flatPrice / Math.max(people.length, 1)
	const currency = billingCurrency([...orders, ...(activePreset?.items ?? [])])

	const lineShare = (order: OrderResponseDto) => {
		const lineTotal = order.price * order.quantity
		if (order.splitAll) return lineTotal / Math.max(people.length, 1)
		return lineTotal / (order.splits.length || 1)
	}

	const shareOf = (items: OrderResponseDto[]) =>
		items.reduce((sum, o) => (o.shouldCalculate ? sum + lineShare(o) : sum), 0)

	const exact = people.map(person => {
		const items = orders.filter(
			o => o.splitAll || o.splits.some(s => s.personId === person.id)
		)
		const rounds: SplitRound[] = [
			{
				key: 'pre',
				label: t('orders.round_pre'),
				items: items.filter(o => o.round === 'pre'),
			},
			{
				key: 'dinner',
				label: t('orders.round_dinner'),
				items: items.filter(o => o.round === 'dinner'),
			},
		]
			.filter(r => r.items.length > 0)
			.map(r => ({
				...r,
				subtotal: shareOf(r.items),
				partial: hasUnpriced(r.items),
			}))
		return {
			person,
			rounds,
			total: shareOf(items) + flatShare,
			partial: hasUnpriced(items),
		}
	})
	// rounded per person so the shares always add up to the table total
	const rounded = allocateCents(exact.map(b => b.total))
	const breakdown = exact.map((b, i) => ({ ...b, total: rounded[i] }))
	const tableTotal = rounded.reduce((sum, v) => sum + v, 0)
	const tablePartial = hasUnpriced(orders)

	const mine = breakdown.find(b => b.person.id === myPersonId)
	const others = breakdown.filter(b => b.person.id !== myPersonId)

	return {
		orders,
		isLoading: ordersLoading || presetsLoading,
		myPersonId,
		flatPrice,
		flatShare,
		currency,
		lineShare,
		breakdown,
		tableTotal,
		tablePartial,
		mine,
		others,
	}
}
