import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonDto, TableDto } from '@/api/model'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useOrders } from './@useOrders'
import { SplitPickerModal } from './@SplitPickerModal'
import { OrderListItem } from './@OrderListItem'
import { TabEmptyState } from './@TabEmptyState'
import { IncludedNote } from './@IncludedNote'
import { PriceDialog } from './@PriceDialog'
import { OrderRoundSection } from './@OrderRoundSection'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import { OrderingStageNotice } from '@/components/common/OrderingStageNotice'
import {
	groupOrders,
	type OrderedLine,
} from '@/components/ordering/groupOrders'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { useListView, ViewToggle } from '@/components/common/ViewToggle'
import { ORDER_LIST_VIEW_STORAGE_KEY } from '@/common/constants'

interface OrdersTabProps {
	table: TableDto
	people: PersonDto[]
	canEdit: boolean
}

const linesTotal = (lines: OrderedLine[]) =>
	lines.reduce(
		(sum, o) => (o.shouldCalculate ? sum + o.price * o.quantity : sum),
		0
	)

export function OrdersTab({ table, people, canEdit }: OrdersTabProps) {
	const { t } = useTranslation()
	const { orders, isLoading, total, updateLine, removeLine } = useOrders(
		table.id
	)
	const { stage, canAdd, canSplit, canChangeItems, canEditPrice } =
		useOrderingStage()
	const canOrder = canEdit && canAdd
	const { view, setView } = useListView(ORDER_LIST_VIEW_STORAGE_KEY)
	const compact = view === 'compact'
	const lines = useMemo(() => groupOrders(orders), [orders])
	const preLines = lines.filter(l => l.round === 'pre')
	const dinnerLines = lines.filter(l => l.round === 'dinner')
	const showRounds =
		dinnerLines.length > 0 || stage === 'dinner' || stage === 'finalized'
	const currency = orders[0]?.currency
	const { personId: myPersonId } = useWhoAmI(table.id)
	const [editing, setEditing] = useState<OrderedLine | null>(null)
	const [removing, setRemoving] = useState<OrderedLine | null>(null)
	const [pricing, setPricing] = useState<OrderedLine | null>(null)

	if (isLoading) {
		return (
			<p className='py-10 text-center text-sm text-muted-foreground'>
				{t('common.loading')}
			</p>
		)
	}

	const renderLines = (group: OrderedLine[]) => (
		<ul className='flex flex-col gap-2'>
			{group.map(line => (
				<OrderListItem
					key={line.key}
					order={line}
					people={people}
					onEditSplit={() => setEditing(line)}
					onRemove={() => setRemoving(line)}
					onQuantityChange={quantity => updateLine(line.ids, { quantity })}
					onEditPrice={
						canEdit && canEditPrice(line) ? () => setPricing(line) : undefined
					}
					compact={compact}
					lockItems={!canEdit || !canChangeItems(line)}
					lockSplit={!canEdit || !canSplit}
				/>
			))}
		</ul>
	)

	return (
		<div className='flex flex-col gap-3'>
			<IncludedNote />
			<OrderingStageNotice />

			{people.length === 0 ? (
				<p className='rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground'>
					{t('orders.needs_people_body')}
				</p>
			) : orders.length === 0 ? (
				<TabEmptyState
					message={t('orders.empty')}
					tableId={table.id}
					canEdit={canOrder}
				/>
			) : (
				<div className='flex items-center justify-between gap-2'>
					{canOrder ? (
						<Button asChild className='gap-1.5 self-start rounded-full'>
							<Link to={`/tables/${table.id}/order`}>
								<Plus className='size-4' />
								{t('orders.add_order')}
							</Link>
						</Button>
					) : (
						<span />
					)}

					<ViewToggle view={view} onChange={setView} />
				</div>
			)}

			{orders.length > 0 &&
				(showRounds ? (
					<>
						{preLines.length > 0 && (
							<OrderRoundSection
								title={t('orders.round_pre')}
								locked={stage !== 'open'}
								subtotal={linesTotal(preLines)}
								currency={currency}
							>
								{renderLines(preLines)}
							</OrderRoundSection>
						)}
						<OrderRoundSection
							title={t('orders.round_dinner')}
							locked={stage === 'finalized'}
							subtotal={linesTotal(dinnerLines)}
							currency={currency}
						>
							{dinnerLines.length > 0 ? (
								renderLines(dinnerLines)
							) : (
								<p className='rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
									{t('orders.round_dinner_empty')}
								</p>
							)}
						</OrderRoundSection>
					</>
				) : (
					renderLines(lines)
				))}

			{orders.length > 0 && (
				<div className='flex items-center justify-between border-t border-border pt-3 text-sm font-semibold text-foreground'>
					<span>{t('orders.total')}</span>
					<span>
						{total.toFixed(2)} {currency}
					</span>
				</div>
			)}

			<SplitPickerModal
				open={editing !== null}
				onOpenChange={open => !open && setEditing(null)}
				people={people}
				initialPersonIds={editing?.splits.map(s => s.personId) ?? []}
				initialSplitAll={editing?.splitAll ?? true}
				myPersonId={myPersonId}
				onConfirm={(splitAll, personIds) => {
					if (editing) updateLine(editing.ids, { splitAll, personIds })
					setEditing(null)
				}}
			/>

			<PriceDialog
				order={pricing}
				onOpenChange={open => !open && setPricing(null)}
				onSave={price => {
					if (pricing) updateLine(pricing.ids, { price })
					setPricing(null)
				}}
			/>

			<ConfirmDialog
				open={removing !== null}
				onOpenChange={open => !open && setRemoving(null)}
				title={t('orders.remove_title', { name: removing?.foodName })}
				description={t('orders.remove_desc')}
				confirmLabel={t('orders.remove')}
				onConfirm={() => {
					if (removing) removeLine(removing.ids)
					setRemoving(null)
				}}
			/>
		</div>
	)
}
