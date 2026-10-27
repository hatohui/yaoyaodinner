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
import { useOrderingOpen } from '@/hooks/useOrderingOpen'
import { OrderingClosedNotice } from '@/components/common/OrderingClosedNotice'
import { groupOrders, type OrderedLine } from './@groupOrders'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { useListView, ViewToggle } from '@/components/common/ViewToggle'
import { ORDER_LIST_VIEW_STORAGE_KEY } from '@/common/constants'

interface OrdersTabProps {
	table: TableDto
	people: PersonDto[]
	canEdit: boolean
}

export function OrdersTab({ table, people, canEdit }: OrdersTabProps) {
	const { t } = useTranslation()
	const { orders, isLoading, total, updateLine, removeLine } = useOrders(
		table.id
	)
	const orderingOpen = useOrderingOpen()
	const canOrder = canEdit && orderingOpen
	const { view, setView } = useListView(ORDER_LIST_VIEW_STORAGE_KEY)
	const compact = view === 'compact'
	const lines = useMemo(() => groupOrders(orders), [orders])
	const { personId: myPersonId } = useWhoAmI(table.id)
	const [editing, setEditing] = useState<OrderedLine | null>(null)
	const [removing, setRemoving] = useState<OrderedLine | null>(null)

	if (isLoading) {
		return (
			<p className='py-10 text-center text-sm text-muted-foreground'>
				{t('common.loading')}
			</p>
		)
	}

	return (
		<div className='flex flex-col gap-3'>
			<IncludedNote />
			{!orderingOpen && <OrderingClosedNotice />}

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

			{orders.length > 0 && (
				<ul className='flex flex-col gap-2'>
					{lines.map(line => (
						<OrderListItem
							key={line.key}
							order={line}
							people={people}
							onEditSplit={() => setEditing(line)}
							onRemove={() => setRemoving(line)}
							onQuantityChange={quantity => updateLine(line.ids, { quantity })}
							compact={compact}
							readOnly={!canEdit}
						/>
					))}
				</ul>
			)}

			{orders.length > 0 && (
				<div className='flex items-center justify-between border-t border-border pt-3 text-sm font-semibold text-foreground'>
					<span>{t('orders.total')}</span>
					<span>
						{total.toFixed(2)} {orders[0]?.currency}
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
					if (editing)
						updateLine(editing.ids, {
							quantity: editing.quantity,
							splitAll,
							personIds,
						})
					setEditing(null)
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
