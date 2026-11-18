import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Plus, ShoppingCart, User } from 'lucide-react'
import type { PersonalDish } from './@planBoard'

interface PersonalOrdersSectionProps {
	tableId: string
	dishes: PersonalDish[]
	canAdd: boolean
}

export function PersonalOrdersSection({
	tableId,
	dishes,
	canAdd,
}: PersonalOrdersSectionProps) {
	const { t } = useTranslation()

	return (
		<section className='flex h-full flex-col gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4'>
			<header className='flex items-center gap-2'>
				<User className='size-4 shrink-0 text-primary' />
				<h2 className='text-sm font-semibold text-foreground'>
					{t('plan_board.individual')}
				</h2>
			</header>

			{dishes.length === 0 ? (
				<p className='text-xs text-muted-foreground'>
					{t('plan_board.individual_empty')}
				</p>
			) : (
				<ul className='flex flex-col gap-1.5'>
					{dishes.map(dish => (
						<li
							key={dish.key}
							className='flex flex-wrap items-baseline gap-x-1.5 text-sm text-foreground'
						>
							<span>{dish.name}</span>
							<span className='font-semibold tabular-nums text-primary'>
								x{dish.quantity}
							</span>
							{dish.people.length > 0 && (
								<span className='text-muted-foreground'>
									({dish.people.join(', ')})
								</span>
							)}
							{dish.inCart && (
								<span className='flex items-center gap-1 self-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary'>
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
					className='flex w-fit items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-solid hover:bg-primary/10'
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
