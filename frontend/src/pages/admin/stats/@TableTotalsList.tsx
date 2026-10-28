import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import type { TableTotalDto } from '@/api/model'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/shadcn'

interface TableTotalsListProps {
	totals: TableTotalDto[]
	isLoading: boolean
}

export function TableTotalsList({ totals, isLoading }: TableTotalsListProps) {
	const { t } = useTranslation()

	if (isLoading) {
		return (
			<div className='flex justify-center py-10'>
				<Spinner />
			</div>
		)
	}

	if (totals.length === 0) {
		return (
			<p className='py-6 text-center text-sm text-muted-foreground'>
				{t('admin.stats.totals_empty')}
			</p>
		)
	}

	const max = Math.max(...totals.map(r => r.total), 1)

	return (
		<ul className='grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
			{totals.map(row => (
				<li key={row.tableId}>
					<Link
						to={`/tables/${row.tableId}`}
						state={{ backTo: '/admin/stats' }}
						className={cn(
							'flex flex-col gap-2 rounded-2xl border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/40',
							row.isOutlier ? 'border-destructive/50' : 'border-border/60'
						)}
					>
						<div className='flex items-center justify-between gap-2'>
							<span className='flex min-w-0 items-center gap-2'>
								<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground'>
									#{row.no}
								</span>
								<span className='truncate font-medium text-foreground'>
									{row.name}
								</span>
							</span>
							<div className='flex shrink-0 items-center gap-1.5'>
								<span className='text-sm font-semibold tabular-nums text-foreground'>
									{row.total.toFixed(2)} RM
								</span>
								{row.isOutlier && (
									<Badge
										variant='outline'
										className='gap-1 rounded-full border-destructive/50 text-destructive'
									>
										<TriangleAlert className='size-3' />
										{t('admin.stats.outlier')}
									</Badge>
								)}
								<ChevronRight className='size-4 text-muted-foreground' />
							</div>
						</div>
						<span className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
							<span
								className={cn(
									'block h-full rounded-full',
									row.isOutlier ? 'bg-destructive' : 'bg-primary'
								)}
								style={{ width: `${Math.min(100, (row.total / max) * 100)}%` }}
							/>
						</span>
					</Link>
				</li>
			))}
		</ul>
	)
}
