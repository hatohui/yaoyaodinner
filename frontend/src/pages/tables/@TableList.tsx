import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GripVertical } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { useGuest } from '@/hooks/useGuest'
import { useEditMode } from '@/hooks/useEditMode'
import { cn } from '@/utils/shadcn'
import { SwapNumberDialog } from '../admin/tables/@SwapNumberDialog'
import { TableCard } from './@TableCard'
import { TableCompactCard } from './@TableCompactCard'
import { TableEditCard } from './@TableEditCard'
import { useTableEditActions } from './@useTableEditActions'
import { useDragAutoScroll } from './@useDragAutoScroll'

interface TableListProps {
	tables: TableDto[]
	compact?: boolean
	showTotal?: boolean
}

export function TableList({ tables, compact, showTotal }: TableListProps) {
	const { t } = useTranslation()
	const myTableId = useGuest(s => s.me?.tableId)
	const { editing } = useEditMode()
	const { renameTable, updateCapacity, swapNumbers } = useTableEditActions()
	const [dragId, setDragId] = useState<string | null>(null)
	const [overId, setOverId] = useState<string | null>(null)
	const [swapping, setSwapping] = useState<TableDto | null>(null)
	useDragAutoScroll(dragId !== null)
	const dragNo = tables.find(tb => tb.id === dragId)?.no
	const Card = compact ? TableCompactCard : TableCard

	const endDrag = () => {
		setDragId(null)
		setOverId(null)
	}

	return (
		<>
			{editing && (
				<p className='mb-3 flex items-center gap-1.5 text-xs text-muted-foreground'>
					<GripVertical className='size-3.5 shrink-0' />
					{t('tables.drag_to_swap')}
				</p>
			)}
			<ul
				data-tour='tables'
				className={cn(
					'grid gap-3',
					compact
						? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
						: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
				)}
			>
				{tables.map(table => (
					<li key={table.id}>
						{editing ? (
							<TableEditCard
								table={table}
								dragging={dragId === table.id}
								dropTarget={
									dragId !== null && overId === table.id && dragId !== table.id
								}
								swapPreviewNo={
									overId === table.id && dragId !== table.id
										? dragNo
										: undefined
								}
								onDragStart={() => setDragId(table.id)}
								onDragEnter={() => setOverId(table.id)}
								onDragEnd={endDrag}
								onDrop={() => {
									if (dragId && dragId !== table.id)
										swapNumbers(dragId, table.id)
									endDrag()
								}}
								onRename={name => renameTable(table.id, name)}
								onCapacityChange={capacity =>
									updateCapacity(table.id, capacity)
								}
								onSwapClick={() => setSwapping(table)}
							/>
						) : (
							<Card
								table={table}
								isMine={table.id === myTableId}
								showTotal={showTotal}
							/>
						)}
					</li>
				))}
			</ul>

			{editing && (
				<SwapNumberDialog
					liveEvent
					table={swapping}
					onOpenChange={open => !open && setSwapping(null)}
					onSwap={([a, b]) => swapNumbers(a, b)}
				/>
			)}
		</>
	)
}
