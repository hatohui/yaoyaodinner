import { useTranslation } from 'react-i18next'
import { Coins, Calculator, UtensilsCrossed, Flame } from 'lucide-react'
import { Card } from '@/components/ui/card'
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
		totalSpend,
		activeTablesCount,
		avgPerTable,
		outliersCount,
		totalOrderedCount,
		uniqueDishesCount,
		topItem,
	} = useAdminStats()

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.stats.title')}
				</h1>
				<div className='flex items-center gap-1 rounded-full border border-border/60 bg-card p-0.5'>
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

			<div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
				<Card className='gap-1.5 rounded-2xl px-4 py-3.5'>
					<div className='flex items-center gap-2 text-muted-foreground'>
						<Coins className='size-4 text-primary' />
						<span className='text-xs font-medium uppercase tracking-wide'>
							{t('admin.stats.totals_title')}
						</span>
					</div>
					<span className='text-2xl font-bold tabular-nums text-foreground'>
						{totalSpend.toFixed(2)}
					</span>
					<span className='text-xs text-muted-foreground'>
						{activeTablesCount}/{tableTotals.length}{' '}
						{t('admin.dashboard.stat_tables').toLowerCase()}
					</span>
				</Card>

				<Card className='gap-1.5 rounded-2xl px-4 py-3.5'>
					<div className='flex items-center gap-2 text-muted-foreground'>
						<Calculator className='size-4 text-primary' />
						<span className='text-xs font-medium uppercase tracking-wide'>
							Avg / {t('admin.people.table')}
						</span>
					</div>
					<span className='text-2xl font-bold tabular-nums text-foreground'>
						{avgPerTable.toFixed(2)}
					</span>
					<span className='text-xs text-muted-foreground'>
						{outliersCount} {t('admin.stats.outlier').toLowerCase()}
					</span>
				</Card>

				<Card className='gap-1.5 rounded-2xl px-4 py-3.5'>
					<div className='flex items-center gap-2 text-muted-foreground'>
						<UtensilsCrossed className='size-4 text-primary' />
						<span className='text-xs font-medium uppercase tracking-wide'>
							{t('admin.dashboard.stat_orders')}
						</span>
					</div>
					<span className='text-2xl font-bold tabular-nums text-foreground'>
						{totalOrderedCount}
					</span>
					<span className='text-xs text-muted-foreground'>
						{t('admin.export.food_count', { count: uniqueDishesCount })}
					</span>
				</Card>

				<Card className='gap-1.5 rounded-2xl px-4 py-3.5'>
					<div className='flex items-center gap-2 text-muted-foreground'>
						<Flame className='size-4 text-primary' />
						<span className='text-xs font-medium uppercase tracking-wide'>
							#1 {t('admin.presets.col_food')}
						</span>
					</div>
					<span className='truncate text-lg font-bold text-foreground'>
						{topItem ? topItem.name : '—'}
					</span>
					<span className='text-xs text-muted-foreground'>
						{topItem
							? t('admin.food.ordered_count', { count: topItem.count })
							: t('admin.stats.popular_empty')}
					</span>
				</Card>
			</div>

			<div className='flex flex-col gap-3'>
				<p className='text-base font-semibold text-foreground'>
					{t('admin.stats.popular_title')}
				</p>
				<div className='grid gap-4 lg:grid-cols-[280px_1fr]'>
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

			<div className='flex flex-col gap-3'>
				<p className='text-base font-semibold text-foreground'>
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
