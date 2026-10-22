import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import type { TableDto } from '@/api/model'
import { FloorPlanBackdrop } from '@/components/floor-plan/FloorPlanBackdrop'
import { FloorPlanTable } from '@/components/floor-plan/FloorPlanTable'
import { useCanHover } from '@/hooks/useCanHover'
import { useGuest } from '@/hooks/useGuest'
import { cn } from '@/utils/shadcn'
import { TableHoverDetails } from './@TableHoverDetails'

interface FloorPlanCanvasProps {
	tables: TableDto[]
	highlightId?: string | null
}

export function FloorPlanCanvas({ tables, highlightId }: FloorPlanCanvasProps) {
	const navigate = useNavigate()
	const myTableId = useGuest(s => s.me?.tableId)
	const canHover = useCanHover()

	useEffect(() => {
		if (!highlightId) return
		document
			.querySelector(`[data-table-id="${highlightId}"]`)
			?.scrollIntoView({ block: 'center', behavior: 'smooth' })
	}, [highlightId, tables])

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
							onClick={
								canHover ? () => navigate(`/tables/${table.id}`) : undefined
							}
							data-table-id={table.id}
							className={cn(
								'border-primary/50 hover:z-10 hover:scale-105',
								table.id === highlightId &&
									'z-10 scale-110 border-primary ring-[1.2cqw] ring-primary/50'
							)}
						/>
					</TableHoverDetails>
				)
			})}
		</div>
	)
}
