import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { type OpenFloors, visibleBand } from '@/components/floor-plan/layout'
import { CreateTableDialog } from '../@CreateTableDialog'
import { AdminFloorPlanCanvas } from './@AdminFloorPlanCanvas'
import { UnplacedTray } from './@UnplacedTray'
import { useAdminFloorPlan } from './@useAdminFloorPlan'
import { useTableDrag } from './@useTableDrag'

export default function AdminFloorPlanPage() {
	const { t } = useTranslation()
	const {
		tables,
		isLoading,
		isError,
		placeTable,
		removeFromMap,
		createTable,
		creating,
	} = useAdminFloorPlan()
	const [openFloors, setOpenFloors] = useState<OpenFloors>({
		first: true,
		ground: true,
	})
	const band = visibleBand(openFloors)
	const drag = useTableDrag(tables, band, placeTable, removeFromMap)

	return (
		<div className='flex flex-col gap-4'>
			<Link
				to='/admin/tables'
				className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
			>
				<ArrowLeft className='size-4' />
				{t('admin.tables.title')}
			</Link>

			<div className='flex items-start justify-between gap-3'>
				<div>
					<h1 className='text-xl font-bold text-foreground'>
						{t('floor_plan.title')}
					</h1>
					<p className='text-sm text-muted-foreground'>
						{t('admin.floor_plan.drag_hint')}
					</p>
				</div>
				<CreateTableDialog pending={creating} onCreate={createTable} />
			</div>

			{isLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : isError ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('tables.load_error')}
				</p>
			) : (
				<>
					<AdminFloorPlanCanvas
						viewportRef={drag.viewportRef}
						canvasRef={drag.canvasRef}
						band={band}
						open={openFloors}
						onToggleFloor={floor =>
							setOpenFloors(prev => ({ ...prev, [floor]: !prev[floor] }))
						}
						tables={drag.placed}
						draggingId={drag.draggingId}
						onDragStart={drag.startDrag}
					/>
					<UnplacedTray
						trayRef={drag.trayRef}
						tables={drag.unplaced}
						acceptsDrop={drag.draggingFromMap}
						isOver={drag.overTray}
						draggingId={drag.draggingId}
						onDragStart={drag.startDrag}
					/>
				</>
			)}
		</div>
	)
}
