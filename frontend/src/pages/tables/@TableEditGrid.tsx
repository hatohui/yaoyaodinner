import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SwapNumberDialog } from '../admin/tables/@SwapNumberDialog'
import { TableEditCard } from './@TableEditCard'
import { useTableEditActions } from './@useTableEditActions'

interface TableEditGridProps {
	tables: TableDto[]
	className: string
}

export function TableEditGrid({ tables, className }: TableEditGridProps) {
	const { t } = useTranslation()
	const { renameTable, updateCapacity, swapNumbers, deleteTable } =
		useTableEditActions()
	const [dragId, setDragId] = useState<string | null>(null)
	const [overId, setOverId] = useState<string | null>(null)
	const [swapping, setSwapping] = useState<TableDto | null>(null)
	const [deleting, setDeleting] = useState<TableDto | null>(null)
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor)
	)
	const dragged = tables.find(tb => tb.id === dragId)

	const endDrag = () => {
		setDragId(null)
		setOverId(null)
	}

	return (
		<>
			<p className='mb-3 flex items-center gap-1.5 text-xs text-muted-foreground'>
				<GripVertical className='size-3.5 shrink-0' />
				{t('tables.drag_to_swap')}
			</p>
			<DndContext
				sensors={sensors}
				onDragStart={e => setDragId(String(e.active.id))}
				onDragOver={e => setOverId(e.over ? String(e.over.id) : null)}
				onDragCancel={endDrag}
				onDragEnd={e => {
					const target = e.over && String(e.over.id)
					if (target && target !== e.active.id)
						swapNumbers(String(e.active.id), target)
					endDrag()
				}}
			>
				<ul className={className}>
					{tables.map(table => (
						<li key={table.id}>
							<TableEditCard
								table={table}
								swapPreviewNo={
									overId === table.id && dragId !== table.id
										? dragged?.no
										: undefined
								}
								onRename={name => renameTable(table.id, name)}
								onCapacityChange={capacity =>
									updateCapacity(table.id, capacity)
								}
								onSwapClick={() => setSwapping(table)}
								onDeleteClick={() => setDeleting(table)}
							/>
						</li>
					))}
				</ul>
				<DragOverlay>
					{dragged && (
						<span className='flex w-fit cursor-grabbing items-center gap-2 rounded-full border border-primary bg-card py-1 pl-1 pr-3 shadow-lg'>
							<span className='flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold tabular-nums text-primary-foreground'>
								{dragged.no}
							</span>
							<span className='max-w-40 truncate text-sm font-semibold text-foreground'>
								{dragged.name}
							</span>
						</span>
					)}
				</DragOverlay>
			</DndContext>

			<SwapNumberDialog
				liveEvent
				table={swapping}
				onOpenChange={open => !open && setSwapping(null)}
				onSwap={([a, b]) => swapNumbers(a, b)}
			/>
			<ConfirmDialog
				open={deleting !== null}
				onOpenChange={open => !open && setDeleting(null)}
				title={t('tables.delete_title', {
					no: deleting?.no,
					name: deleting?.name,
				})}
				description={t('admin.tables.bulk_delete_desc')}
				confirmLabel={t('admin.tables.delete_selected')}
				onConfirm={() => {
					if (deleting) deleteTable(deleting.id)
					setDeleting(null)
				}}
			/>
		</>
	)
}
