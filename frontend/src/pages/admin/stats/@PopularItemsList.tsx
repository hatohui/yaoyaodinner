import { useTranslation } from 'react-i18next'
import { ListOrdered } from 'lucide-react'
import type { PopularItemDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface PopularItemsListProps {
	items: PopularItemDto[]
	isLoading: boolean
	onShowAll: () => void
}

export function PopularItemsList({
	items,
	isLoading,
	onShowAll,
}: PopularItemsListProps) {
	const { t } = useTranslation()

	if (isLoading) {
		return (
			<div className='flex justify-center py-10'>
				<Spinner />
			</div>
		)
	}

	if (items.length === 0) {
		return (
			<p className='py-6 text-center text-sm text-muted-foreground'>
				{t('admin.stats.popular_empty')}
			</p>
		)
	}

	const max = Math.max(...items.map(i => i.count), 1)
	const total = items.reduce((sum, i) => sum + i.count, 0)

	return (
		<div className='flex h-full flex-col justify-between gap-4'>
			<ul className='grid gap-x-4 gap-y-2 sm:grid-cols-2'>
				{items.map((item, index) => {
					const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
					return (
						<li key={item.variantId}>
							<button
								type='button'
								onClick={onShowAll}
								className='flex w-full cursor-pointer flex-col gap-1.5 rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/50'
							>
								<span className='flex w-full items-center justify-between gap-2 text-sm'>
									<span className='flex min-w-0 items-center gap-2'>
										<span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary'>
											{index + 1}
										</span>
										<span className='truncate font-medium text-foreground'>
											{item.name}
										</span>
									</span>
									<span className='shrink-0 text-xs tabular-nums text-muted-foreground'>
										<strong className='font-semibold text-foreground'>
											{item.count}
										</strong>{' '}
										({pct}%)
									</span>
								</span>
								<span className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
									<span
										className='block h-full rounded-full bg-primary'
										style={{ width: `${(item.count / max) * 100}%` }}
									/>
								</span>
							</button>
						</li>
					)
				})}
			</ul>
			<Button
				variant='outline'
				size='sm'
				className='gap-1.5 self-center rounded-full'
				onClick={onShowAll}
			>
				<ListOrdered className='size-3.5' />
				{t('admin.stats.all_ordered')}
			</Button>
		</div>
	)
}
