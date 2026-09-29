import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { FloorPlanCanvas } from './@FloorPlanCanvas'
import { FloorPlanLegend } from './@FloorPlanLegend'
import { useFloorPlan } from './@useFloorPlan'

export default function FloorPlanPage() {
	const { t } = useTranslation()
	const { tables, isLoading, isError } = useFloorPlan()

	return (
		<div className='mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6'>
			<Link
				to='/tables'
				className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
			>
				<ArrowLeft className='size-4' />
				{t('tables.all_tables')}
			</Link>

			<h1 className='text-xl font-bold text-foreground'>
				{t('floor_plan.title')}
			</h1>

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
					<FloorPlanCanvas tables={tables} />
					<FloorPlanLegend />
				</>
			)}
		</div>
	)
}
