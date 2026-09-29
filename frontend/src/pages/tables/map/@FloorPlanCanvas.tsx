import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { TableDto } from '@/api/model'
import { FloorPlanBackdrop } from '@/components/floor-plan/FloorPlanBackdrop'
import { FloorPlanTable } from '@/components/floor-plan/FloorPlanTable'
import { useGuest } from '@/hooks/useGuest'
import { cn } from '@/utils/shadcn'
import { TableHoverDetails } from './@TableHoverDetails'

interface FloorPlanCanvasProps {
	tables: TableDto[]
}

export function FloorPlanCanvas({ tables }: FloorPlanCanvasProps) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const myTableId = useGuest(s => s.me?.tableId)

	return (
		<div className='@container relative aspect-[872/1000] w-full overflow-hidden'>
			<FloorPlanBackdrop tables={tables} />

			{tables.map(table => {
				const isMine = table.id === myTableId
				return (
					<TableHoverDetails key={table.id} table={table} isMine={isMine}>
						<FloorPlanTable
							table={table}
							isMine={isMine}
							onClick={() => navigate(`/tables/${table.id}`)}
							className={cn(
								'hover:z-10 hover:scale-105',
								table.seated >= table.capacity
									? 'border-destructive/50'
									: 'border-primary/50'
							)}
						/>
					</TableHoverDetails>
				)
			})}

			{tables.length === 0 && (
				<p className='absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground'>
					{t('floor_plan.empty')}
				</p>
			)}
		</div>
	)
}
