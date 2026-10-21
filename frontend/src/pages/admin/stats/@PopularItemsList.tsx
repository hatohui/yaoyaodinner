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

	return (
		<div className='flex flex-col gap-3'>
			<ul className='flex flex-col gap-1'>
				{items.map(item => (
					<li key={item.variantId}>
						<button
							type='button'
							onClick={onShowAll}
							className='flex w-full cursor-pointer flex-col gap-1 rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/50'
						>
							<span className='flex w-full items-center justify-between gap-2 text-sm'>
								<span className='truncate font-medium text-foreground'>
									{item.name}
								</span>
								<span className='text-muted-foreground'>{item.count}</span>
							</span>
							<span className='h-2 w-full overflow-hidden rounded-full bg-muted'>
								<span
									className='block h-full rounded-full bg-primary'
									style={{ width: `${(item.count / max) * 100}%` }}
								/>
							</span>
						</button>
					</li>
				))}
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
