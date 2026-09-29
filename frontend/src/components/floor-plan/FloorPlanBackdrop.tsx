import { useTranslation } from 'react-i18next'
import type { TableDto } from '@/api/model'
import { cn } from '@/utils/shadcn'
import { FloorHeader } from './FloorHeader'
import {
	FLOORS,
	LABEL_H,
	type FloorId,
	type OpenFloors,
	toPercent,
} from './layout'

interface FloorPlanBackdropProps {
	tables: TableDto[]
	open?: OpenFloors
	onToggleFloor?: (floor: FloorId) => void
}

export function FloorPlanBackdrop({
	tables,
	open,
	onToggleFloor,
}: FloorPlanBackdropProps) {
	const { t } = useTranslation()
	const openCount = open ? FLOORS.filter(floor => open[floor.id]).length : 0

	return (
		<>
			{FLOORS.map(floor => (
				<div key={floor.id} className='contents'>
					<div
						style={toPercent({ ...floor, y: floor.y - LABEL_H, h: LABEL_H })}
						className={cn('absolute', open?.[floor.id] === false && 'hidden')}
					>
						<FloorHeader
							floor={floor}
							tables={tables}
							disabled={openCount === 1}
							onToggle={onToggleFloor && (() => onToggleFloor(floor.id))}
							className='size-full'
						/>
					</div>

					<div
						style={toPercent(floor)}
						className='absolute rounded-[1.5cqw] border border-border bg-background'
					/>

					{floor.fixtures.map((fixture, i) => (
						<div
							key={i}
							style={toPercent(fixture)}
							className={cn(
								'absolute flex items-center justify-center',
								fixture.w > 2 ? 'border border-border bg-muted' : 'bg-border'
							)}
						>
							{fixture.labelKey && (
								<span
									className={cn(
										'text-center leading-tight font-semibold text-muted-foreground',
										fixture.emphasis ? 'text-[4.5cqw]' : 'text-[2.6cqw]'
									)}
								>
									{t(`floor_plan.${fixture.labelKey}`)}
								</span>
							)}
						</div>
					))}
				</div>
			))}
		</>
	)
}
