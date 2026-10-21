import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/shadcn'
import { PopularItemsList } from './@PopularItemsList'
import { PopularItemsChart } from './@PopularItemsChart'
import { TableTotalsList } from './@TableTotalsList'
import { TableTotalsChart } from './@TableTotalsChart'
import { AllOrderedDialog } from './@AllOrderedDialog'
import { useAdminStats } from './@useAdminStats'

export default function AdminStatsPage() {
	const { t } = useTranslation()
	const {
		scope,
		setScope,
		popular,
		popularLoading,
		allOpen,
		setAllOpen,
		allOrdered,
		allLoading,
		tableTotals,
		totalsLoading,
	} = useAdminStats()

	return (
		<div className='flex flex-col gap-6'>
			<h1 className='text-xl font-bold text-foreground'>
				{t('admin.stats.title')}
			</h1>

			<div className='flex flex-col gap-4'>
				<div className='flex items-center justify-between gap-2'>
					<p className='text-lg font-semibold text-foreground'>
						{t('admin.stats.popular_title')}
					</p>
					<div className='flex items-center gap-1 rounded-full border border-border/60 p-0.5'>
						{(['event', 'all'] as const).map(s => (
							<button
								key={s}
								type='button'
								onClick={() => setScope(s)}
								className={cn(
									'rounded-full px-3 py-1 text-xs font-medium transition-colors',
									scope === s
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:text-foreground'
								)}
							>
								{s === 'event'
									? t('admin.stats.scope_event')
									: t('admin.stats.scope_all')}
							</button>
						))}
					</div>
				</div>
				<div className='grid gap-4 lg:grid-cols-[1fr_300px]'>
					<PopularItemsChart items={popular} isLoading={popularLoading} />
					<div className='rounded-2xl border border-border/60 bg-card p-4 shadow-sm'>
						<PopularItemsList
							items={popular}
							isLoading={popularLoading}
							onShowAll={() => setAllOpen(true)}
						/>
					</div>
				</div>
			</div>

			<div className='flex flex-col gap-4 pt-4'>
				<p className='text-lg font-semibold text-foreground'>
					{t('admin.stats.totals_title')}
				</p>
				<TableTotalsChart totals={tableTotals} isLoading={totalsLoading} />
				<TableTotalsList totals={tableTotals} isLoading={totalsLoading} />
			</div>

			<AllOrderedDialog
				open={allOpen}
				onOpenChange={setAllOpen}
				items={allOrdered}
				isLoading={allLoading}
			/>
		</div>
	)
}
