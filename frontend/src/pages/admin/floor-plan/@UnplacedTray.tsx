import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { GripVertical, Users } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { cn } from '@/utils/shadcn'

interface UnplacedTrayProps {
	trayRef: RefObject<HTMLDivElement | null>
	tables: TableDto[]
	acceptsDrop: boolean
	isOver: boolean
	draggingId: string | null
	onDragStart: (table: TableDto, e: React.PointerEvent) => void
}

export function UnplacedTray({
	trayRef,
	tables,
	acceptsDrop,
	isOver,
	draggingId,
	onDragStart,
}: UnplacedTrayProps) {
	const { t } = useTranslation()

	if (tables.length === 0 && !acceptsDrop) return null

	return (
		<div
			ref={trayRef}
			className={cn(
				'mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-dashed p-3 transition-colors',
				isOver
					? 'border-primary bg-primary/10'
					: acceptsDrop
						? 'border-primary/50'
						: 'border-border'
			)}
		>
			<div className='flex items-baseline justify-between gap-2'>
				<span className='text-sm font-semibold text-foreground'>
					{t('admin.floor_plan.unplaced')}
				</span>
				<span className='text-xs text-muted-foreground'>
					{acceptsDrop
						? t('admin.floor_plan.drop_to_remove')
						: t('admin.floor_plan.unplaced_hint')}
				</span>
			</div>
			<div className='flex flex-wrap gap-2'>
				{tables.map(table => (
					<button
						key={table.id}
						type='button'
						onPointerDown={e => onDragStart(table, e)}
						className={cn(
							'flex cursor-grab touch-none items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold shadow-sm select-none',
							draggingId === table.id
								? 'cursor-grabbing border-primary opacity-60'
								: 'border-border'
						)}
					>
						<GripVertical className='size-3.5 text-muted-foreground' />
						<span className='text-foreground'>{table.name}</span>
						<span className='flex items-center gap-1 font-medium text-muted-foreground'>
							<Users className='size-3' />
							{table.capacity}
						</span>
					</button>
				))}
			</div>
		</div>
	)
}
