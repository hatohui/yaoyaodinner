import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { TableDto } from '@/api/model'
import { FloorPlanBackdrop } from '@/components/floor-plan/FloorPlanBackdrop'
import { FloorHeader } from '@/components/floor-plan/FloorHeader'
import { FloorPlanTable } from '@/components/floor-plan/FloorPlanTable'
import {
	CANVAS_H,
	CANVAS_W,
	FLOORS,
	LABEL_H,
	type FloorId,
	type OpenFloors,
} from '@/components/floor-plan/layout'
import { cn } from '@/utils/shadcn'

interface AdminFloorPlanCanvasProps {
	viewportRef: RefObject<HTMLDivElement | null>
	canvasRef: RefObject<HTMLDivElement | null>
	band: { top: number; height: number }
	open: OpenFloors
	onToggleFloor: (floor: FloorId) => void
	tables: TableDto[]
	draggingId: string | null
	onDragStart: (table: TableDto, e: React.PointerEvent) => void
}

export function AdminFloorPlanCanvas({
	viewportRef,
	canvasRef,
	band,
	open,
	onToggleFloor,
	tables,
	draggingId,
	onDragStart,
}: AdminFloorPlanCanvasProps) {
	const { t } = useTranslation()

	const collapsedBar = (floorId: FloorId) => {
		const floor = FLOORS.find(f => f.id === floorId)
		if (!floor || open[floorId]) return null
		return (
			<FloorHeader
				floor={floor}
				tables={tables}
				open={false}
				onToggle={() => onToggleFloor(floorId)}
				className='w-full'
				style={{ aspectRatio: `${CANVAS_W} / ${LABEL_H}` }}
			/>
		)
	}

	return (
		<div className='@container mx-auto w-full max-w-3xl'>
			{collapsedBar('first')}
			<div
				ref={viewportRef}
				style={{ aspectRatio: `${CANVAS_W} / ${band.height}` }}
				className='relative w-full overflow-hidden'
			>
				<div
					ref={canvasRef}
					style={{
						top: `${(-band.top / band.height) * 100}%`,
						height: `${(CANVAS_H / band.height) * 100}%`,
					}}
					className='absolute inset-x-0 touch-none select-none'
				>
					<FloorPlanBackdrop
						tables={tables}
						open={open}
						onToggleFloor={onToggleFloor}
					/>

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
			{collapsedBar('ground')}
		</div>
	)
}
