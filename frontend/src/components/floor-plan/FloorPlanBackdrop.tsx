import { useTranslation } from 'react-i18next'
import type { TableDto } from '@/api/model'
import { cn } from '@/utils/shadcn'
import { FLOORS, LABEL_H, floorSummary, toPercent } from './layout'

interface FloorPlanBackdropProps {
	tables: TableDto[]
}

export function FloorPlanBackdrop({ tables }: FloorPlanBackdropProps) {
	const { t } = useTranslation()

	return (
		<>
			{FLOORS.map(floor => {
				const summary = floorSummary(tables, floor.id)
				return (
					<div key={floor.id} className='contents'>
						<div
							style={toPercent({ ...floor, y: floor.y - LABEL_H, h: LABEL_H })}
							className='absolute flex items-center justify-between px-[1.5cqw] text-[2.2cqw]'
						>
							<span className='font-semibold text-foreground'>
								{t(`floor_plan.${floor.labelKey}`)}
							</span>
							<span className='text-muted-foreground'>
								{t('floor_plan.floor_summary', summary)}
							</span>
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
				)
			})}
		</>
	)
}
