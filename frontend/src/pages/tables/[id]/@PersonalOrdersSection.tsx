import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Plus, ShoppingCart, User, Users } from 'lucide-react'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import type { PersonalDish } from './@planBoard'

interface PersonalOrdersSectionProps {
	tableId: string
	dishes: PersonalDish[]
	canAdd: boolean
	onSelectFood?: (foodId: string) => void
}

export function PersonalOrdersSection({
	tableId,
	dishes,
	canAdd,
	onSelectFood,
}: PersonalOrdersSectionProps) {
	const { t } = useTranslation()

	return (
		<section className='flex h-full flex-col gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4'>
			<header className='flex items-center gap-2'>
				<span className='flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary'>
					<User className='size-3.5' />
				</span>
				<h2 className='text-sm font-semibold text-foreground'>
					{t('plan_board.individual')}
				</h2>
			</header>

			{dishes.length === 0 ? (
				<p className='text-xs text-muted-foreground'>
					{t('plan_board.individual_empty')}
				</p>
			) : (
				<ul className='flex flex-col divide-y divide-border/60'>
					{dishes.map(dish => (
						<li key={dish.key} className='flex items-center gap-2.5 py-2.5'>
							{onSelectFood ? (
								<button
									type='button'
									onClick={() => onSelectFood(dish.foodId)}
									className='shrink-0 cursor-pointer rounded-xl transition-opacity hover:opacity-85'
								>
									<OrderThumb
										imageKey={dish.imageUrl}
										alt={dish.name}
										className='size-10 rounded-xl sm:size-11'
									/>
								</button>
							) : (
								<OrderThumb
									imageKey={dish.imageUrl}
									alt={dish.name}
									className='size-10 rounded-xl sm:size-11'
								/>
							)}
							<div className='flex min-w-0 flex-1 flex-col justify-center gap-0.5'>
								<div className='flex min-w-0 items-baseline gap-1.5'>
									{onSelectFood ? (
										<button
											type='button'
											title={dish.name}
											onClick={() => onSelectFood(dish.foodId)}
											className='min-w-0 cursor-pointer truncate text-left text-sm leading-tight font-medium text-foreground transition-colors hover:text-primary'
										>
											{dish.name}
										</button>
									) : (
										<span
											title={dish.name}
											className='min-w-0 truncate text-sm leading-tight font-medium text-foreground'
										>
											{dish.name}
										</span>
									)}
									<span className='shrink-0 text-xs font-semibold tabular-nums text-primary'>
										×{dish.quantity}
									</span>
								</div>
								{dish.people.length > 0 && (
									<span className='inline-flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground'>
										<Users className='size-3 shrink-0' />
										<span className='truncate'>{dish.people.join(', ')}</span>
									</span>
								)}
							</div>
							{dish.inCart && (
								<span className='inline-flex h-5 shrink-0 items-center gap-1 rounded-md bg-primary/15 px-2 text-[11px] font-semibold text-primary'>
									<ShoppingCart className='size-3' />
									{t('plan_board.status_in_cart')}
								</span>
							)}
						</li>
					))}
				</ul>
			)}

			{canAdd && (
				<Link
					to={`/tables/${tableId}/order?split=individual`}
					className='flex w-fit items-center gap-1.5 rounded-xl border border-dashed border-primary/50 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-solid hover:bg-primary/10'
				>
					<Plus className='size-3.5' />
					{t('plan_board.add_individual')}
				</Link>
			)}
			{canAdd && dishes.length === 0 && (
				<p className='text-[11px] text-muted-foreground'>
					{t('plan_board.individual_hint')}
				</p>
			)}
		</section>
	)
}
