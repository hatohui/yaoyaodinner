import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { TableDto } from '@/api/model'
import { FloorPlanBackdrop } from '@/components/floor-plan/FloorPlanBackdrop'
import { FloorPlanTable } from '@/components/floor-plan/FloorPlanTable'
import { CANVAS_H, CANVAS_W } from '@/components/floor-plan/layout'
import { cn } from '@/utils/shadcn'

interface AdminFloorPlanCanvasProps {
	viewportRef: RefObject<HTMLDivElement | null>
	canvasRef: RefObject<HTMLDivElement | null>
	band: { top: number; height: number }
	tables: TableDto[]
	draggingId: string | null
	onDragStart: (table: TableDto, e: React.PointerEvent) => void
}

export function AdminFloorPlanCanvas({
	viewportRef,
	canvasRef,
	band,
	tables,
	draggingId,
	onDragStart,
}: AdminFloorPlanCanvasProps) {
	const { t } = useTranslation()

	return (
		<div
			ref={viewportRef}
			style={{ aspectRatio: `${CANVAS_W} / ${band.height}` }}
			className='@container relative mx-auto w-full max-w-3xl overflow-hidden'
		>
			<div
				ref={canvasRef}
				style={{
					top: `${(-band.top / band.height) * 100}%`,
					height: `${(CANVAS_H / band.height) * 100}%`,
				}}
				className='absolute inset-x-0 touch-none select-none'
			>
				<FloorPlanBackdrop tables={tables} />

				{tables.map(table => (
					<FloorPlanTable
						key={table.id}
						table={table}
						onPointerDown={e => onDragStart(table, e)}
						className={cn(
							'cursor-grab touch-none',
							draggingId === table.id
								? 'z-10 scale-110 cursor-grabbing border-primary shadow-lg'
								: 'border-primary/40'
						)}
					/>
				))}
			</div>

			{tables.length === 0 && (
				<p className='absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground'>
					{t('floor_plan.empty')}
				</p>
			)}
		</div>
	)
}
