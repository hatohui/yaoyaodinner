import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
	ArrowRight,
	Check,
	ListChecks,
	Plus,
	ShoppingCart,
	Star,
} from 'lucide-react'
import type { TableWishDto } from '@/api/model'
import type { WishStatus } from '@/hooks/useTableWishes'
import { cn } from '@/utils/shadcn'

interface WishlistStripProps {
	tableId: string
	wishes: TableWishDto[]
	statusOf: (wish: TableWishDto) => WishStatus
	onAdd: (wish: TableWishDto) => void
}

export function WishlistStrip({
	tableId,
	wishes,
	statusOf,
	onAdd,
}: WishlistStripProps) {
	const { t } = useTranslation()

	const sorted = [...wishes].sort(
		(a, b) => Number(b.kind === 'must') - Number(a.kind === 'must')
	)
	const left = sorted.filter(w => statusOf(w) === 'open').length

	return (
		<section className='flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3'>
			<header className='flex items-center gap-2'>
				<ListChecks className='size-4 shrink-0 text-primary' />
				<h2 className='text-sm font-semibold text-foreground'>
					{t('plan_board.strip_title')}
				</h2>
				<span className='min-w-0 flex-1 truncate text-xs text-muted-foreground'>
					{wishes.length === 0
						? t('plan_board.strip_empty')
						: left > 0
							? t('plan_board.strip_left', { count: left })
							: t('plan_board.strip_done')}
				</span>
				<Link
					to={`/tables/${tableId}?tab=plan`}
					className='flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10'
				>
					{t('plan_board.open_plan')}
					<ArrowRight className='size-3.5' />
				</Link>
			</header>
			{wishes.length > 0 && (
				<ul className='flex flex-wrap gap-1.5'>
					{sorted.map(wish => {
						const status = statusOf(wish)
						const addable = status === 'open' && Boolean(wish.foodId)
						return (
							<li key={wish.id}>
								<button
									type='button'
									disabled={!addable}
									onClick={() => onAdd(wish)}
									title={addable ? t('plan_board.add_to_cart') : undefined}
									className={cn(
										'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
										status === 'ordered' &&
											'border-transparent bg-primary text-primary-foreground',
										status === 'in_cart' &&
											'border-primary/40 bg-primary/15 text-primary',
										status === 'open' &&
											'border-border bg-card text-foreground',
										addable
											? 'cursor-pointer hover:border-primary/40 hover:bg-primary/10'
											: 'cursor-default'
									)}
								>
									{wish.kind === 'must' && status === 'open' && (
										<Star className='size-3 fill-primary text-primary' />
									)}
									{wish.name}
									{status === 'ordered' && <Check className='size-3' />}
									{status === 'in_cart' && <ShoppingCart className='size-3' />}
									{addable && <Plus className='size-3 text-primary' />}
								</button>
							</li>
						)
					})}
				</ul>
			)}
		</section>
	)
}
