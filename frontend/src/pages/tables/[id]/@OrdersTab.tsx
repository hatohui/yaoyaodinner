import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OrderResponseDto, PersonDto, TableDto } from '@/api/model'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useOrders } from './@useOrders'
import { SplitPickerModal } from './@SplitPickerModal'
import { OrderListItem } from './@OrderListItem'
import { useWhoAmI } from '@/hooks/useWhoAmI'

interface OrdersTabProps {
	table: TableDto
	people: PersonDto[]
}

export function OrdersTab({ table, people }: OrdersTabProps) {
	const { t } = useTranslation()
	const { orders, isLoading, total, setQuantity, setSplit, remove } = useOrders(
		table.id
	)
	const { personId: myPersonId } = useWhoAmI(table.id)
	const [editing, setEditing] = useState<OrderResponseDto | null>(null)
	const [removing, setRemoving] = useState<OrderResponseDto | null>(null)

	if (isLoading) {
		return (
			<p className='py-10 text-center text-sm text-muted-foreground'>
				{t('common.loading')}
			</p>
		)
	}

	return (
		<div className='flex flex-col gap-3'>
			{people.length === 0 ? (
				<p className='rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground'>
					{t('orders.needs_people_body')}
				</p>
			) : (
				<Button asChild className='gap-1.5 self-start rounded-full'>
					<Link to={`/tables/${table.id}/order`}>
						<Plus className='size-4' />
						{t('orders.add_order')}
					</Link>
				</Button>
			)}

			{orders.length === 0 ? (
				<p className='py-6 text-center text-sm text-muted-foreground'>
					{t('orders.empty')}
				</p>
			) : (
				<ul className='flex flex-col gap-2'>
					{orders.map(order => (
						<OrderListItem
							key={order.id}
							order={order}
							people={people}
							onEditSplit={() => setEditing(order)}
							onRemove={() => setRemoving(order)}
							onQuantityChange={quantity => setQuantity(order.id, quantity)}
						/>
					))}
				</ul>
			)}

			{orders.length > 0 && (
				<div className='flex items-center justify-between border-t border-border/60 pt-3 text-sm font-semibold text-foreground'>
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
					if (editing) setSplit(editing.id, splitAll, personIds)
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
					if (removing) remove(removing.id)
					setRemoving(null)
				}}
			/>
		</div>
	)
}
