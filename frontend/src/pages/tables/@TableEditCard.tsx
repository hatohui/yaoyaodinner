import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
	ArrowLeftRight,
	ArrowUpRight,
	GripVertical,
	Trash2,
	Users,
} from 'lucide-react'
import type { TableDto } from '@/api/model'
import { InlineEdit } from '@/components/common/InlineEdit'
import { cn } from '@/utils/shadcn'

interface TableEditCardProps {
	table: TableDto
	swapPreviewNo?: number
	onRename: (name: string) => void
	onCapacityChange: (capacity: number) => void
	onSwapClick: () => void
	onDeleteClick: () => void
}

const iconButton =
	'flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'

export function TableEditCard({
	table,
	swapPreviewNo,
	onRename,
	onCapacityChange,
	onSwapClick,
	onDeleteClick,
}: TableEditCardProps) {
	const { t } = useTranslation()
	const drag = useDraggable({ id: table.id })
	const drop = useDroppable({ id: table.id })
	const dropTarget = drop.isOver && !drag.isDragging

	return (
		<div
			ref={node => {
				drag.setNodeRef(node)
				drop.setNodeRef(node)
			}}
			className={cn(
				'flex h-full flex-col gap-2 rounded-2xl border border-dashed border-primary/40 bg-card p-3 shadow-sm transition-all',
				drag.isDragging && 'opacity-40',
				dropTarget && 'scale-[1.02] border-solid border-primary bg-primary/10'
			)}
		>
			<div className='flex items-center gap-1.5'>
				<button
					type='button'
					ref={drag.setActivatorNodeRef}
					{...drag.listeners}
					{...drag.attributes}
					aria-label={t('tables.drag_to_swap')}
					title={t('tables.drag_to_swap')}
					className='flex cursor-grab touch-none items-center gap-0.5 rounded-full active:cursor-grabbing'
				>
					<GripVertical className='size-4 shrink-0 text-muted-foreground' />
					<span className='flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold tabular-nums text-primary-foreground'>
						{table.no}
					</span>
				</button>
				{swapPreviewNo !== undefined && (
					<span className='flex items-center gap-1 text-sm font-bold tabular-nums text-primary'>
						<ArrowLeftRight className='size-3.5' />
						{swapPreviewNo}
					</span>
				)}
				<span className='flex-1' />
				<button
					type='button'
					onClick={onSwapClick}
					aria-label={t('admin.tables.swap_with')}
					title={t('admin.tables.swap_with')}
					className={iconButton}
				>
					<ArrowLeftRight className='size-4' />
				</button>
				<Link
					to={`/tables/${table.id}`}
					aria-label={t('tables.open_table')}
					title={t('tables.open_table')}
					className={iconButton}
				>
					<ArrowUpRight className='size-4' />
				</Link>
				<button
					type='button'
					onClick={onDeleteClick}
					aria-label={t('admin.tables.delete_selected')}
					title={t('admin.tables.delete_selected')}
					className={cn(
						iconButton,
						'hover:bg-destructive/10 hover:text-destructive'
					)}
				>
					<Trash2 className='size-4' />
				</button>
			</div>

			<InlineEdit
				alwaysEditable
				value={table.name}
				onCommit={name => name.trim() && onRename(name.trim())}
				placeholder={t('admin.tables.name_placeholder')}
				inputClassName='h-8 w-full rounded-lg px-2 text-left text-sm font-semibold'
			/>

			<label className='mt-auto flex items-center gap-1.5 text-xs text-muted-foreground'>
				<Users className='size-3.5 shrink-0 text-primary' />
				<span className='tabular-nums'>{table.seated} /</span>
				<InlineEdit
					alwaysEditable
					type='number'
					value={String(table.capacity)}
					onCommit={v => {
						const capacity = Number(v)
						if (capacity >= Math.max(table.seated, 1))
							onCapacityChange(capacity)
					}}
					inputClassName='h-6 w-12 rounded-full px-1 py-0 text-xs font-semibold'
				/>
				<span>{t('tables.max_guests')}</span>
			</label>
		</div>
	)
}
