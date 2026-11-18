import { useTranslation } from 'react-i18next'
import {
	Ban,
	Check,
	ShieldAlert,
	ShoppingCart,
	Sparkles,
	Star,
	User,
	Users,
} from 'lucide-react'
import type { PersonDto, TableWishDto } from '@/api/model'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import type { WishStatus } from '@/hooks/useTableWishes'
import { awaitingPrice, billingCurrency, hasUnpriced } from '@/utils/money'
import { cn } from '@/utils/shadcn'
import type { AllergyGroup, PersonalDish } from './@planBoard'

interface PlanSummaryViewProps {
	must: TableWishDto[]
	want: TableWishDto[]
	avoid: TableWishDto[]
	dishes: PersonalDish[]
	allergies: AllergyGroup[]
	people: PersonDto[]
	statusOf: (wish: TableWishDto) => WishStatus
	labelOf: (group: Pick<AllergyGroup, 'allergen' | 'label'>) => string
	onSelectFood?: (foodId: string) => void
}

export function PlanSummaryView({
	must,
	want,
	avoid,
	dishes,
	allergies,
	people,
	statusOf,
	labelOf,
	onSelectFood,
}: PlanSummaryViewProps) {
	const { t } = useTranslation()
	const seatedIds = new Set(people.map(p => p.id))
	const peopleNames = new Map(people.map(p => [p.id, p.name]))

	const planned = [...must, ...want]
	const estimatedTotal = planned.reduce((sum, w) => {
		if (!w.shouldCalculate || awaitingPrice(w)) return sum
		return sum + (w.price ?? 0) * (w.quantity ?? 1)
	}, 0)
	const currency = billingCurrency(planned)
	const partial = hasUnpriced(planned)

	const isEmpty =
		must.length === 0 &&
		want.length === 0 &&
		avoid.length === 0 &&
		dishes.length === 0 &&
		allergies.length === 0

	if (isEmpty) {
		return (
			<div className='rounded-2xl border border-dashed border-border bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground'>
				{t('plan_board.strip_empty')}
			</div>
		)
	}

	const groups = [
		{
			key: 'must',
			title: t('plan_board.must'),
			icon: Star,
			items: must,
			isAvoid: false,
		},
		{
			key: 'want',
			title: t('plan_board.want'),
			icon: Sparkles,
			items: want,
			isAvoid: false,
		},
		{
			key: 'avoid',
			title: t('plan_board.avoid'),
			icon: Ban,
			items: avoid,
			isAvoid: true,
		},
	].filter(g => g.items.length > 0)

	const renderPrice = (wish: TableWishDto) => {
		if (!wish.foodId) {
			return (
				<span className='text-[11px] text-muted-foreground'>
					{t('plan_board.off_menu')}
				</span>
			)
		}
		if (!wish.shouldCalculate) {
			return (
				<span className='text-xs text-muted-foreground'>
					{t('orders.free')}
				</span>
			)
		}
		if (awaitingPrice(wish)) {
			return (
				<span className='text-xs text-muted-foreground'>
					{t('menu.seasonal_price')}
				</span>
			)
		}
		const amount = (wish.price ?? 0) * (wish.quantity ?? 1)
		return (
			<span className='text-xs font-semibold tabular-nums text-foreground'>
				{amount.toFixed(2)} {wish.currency}
			</span>
		)
	}

	return (
		<div className='overflow-hidden rounded-2xl border border-border bg-card shadow-sm'>
			<div className='divide-y divide-border'>
				{groups.map(({ key, title, icon: Icon, items, isAvoid }) => (
					<section key={key}>
						<header className='flex items-center gap-2 bg-muted/35 px-3 py-2 sm:px-4'>
							<span
								className={cn(
									'flex size-5 shrink-0 items-center justify-center rounded-md',
									isAvoid
										? 'bg-destructive/15 text-destructive'
										: 'bg-primary/15 text-primary'
								)}
							>
								<Icon className='size-3' />
							</span>
							<h3 className='text-xs font-semibold uppercase tracking-wide text-foreground'>
								{title}
							</h3>
							<span className='text-xs tabular-nums text-muted-foreground'>
								{items.length}
							</span>
						</header>
						<ul className='divide-y divide-border/60'>
							{items.map(wish => {
								const status = statusOf(wish)
								const qty = wish.quantity ?? 1
								const who = wish.personIds
									.filter(id => seatedIds.has(id))
									.map(id => peopleNames.get(id))
									.filter((n): n is string => Boolean(n))
								const clickable = Boolean(wish.foodId && onSelectFood)

								const rowBody = (
									<>
										<OrderThumb
											imageKey={wish.foodImageUrl}
											alt={wish.name}
											className='size-7 shrink-0 rounded-md'
										/>
										<div className='flex min-w-0 flex-1 flex-col'>
											<div className='flex min-w-0 items-center gap-1.5'>
												<span
													title={wish.name}
													className={cn(
														'truncate text-xs font-medium text-foreground sm:text-sm',
														status === 'ordered' &&
															!isAvoid &&
															'text-muted-foreground line-through'
													)}
												>
													{wish.name}
												</span>
												{!isAvoid && wish.variantLabel && (
													<span className='shrink-0 text-[11px] text-muted-foreground'>
														· {wish.variantLabel}
													</span>
												)}
												{!isAvoid && qty > 1 && (
													<span className='shrink-0 text-[11px] font-semibold tabular-nums text-primary'>
														×{qty}
													</span>
												)}
												{!isAvoid && status === 'ordered' && (
													<Check className='size-3.5 shrink-0 text-primary' />
												)}
												{!isAvoid && status === 'in_cart' && (
													<ShoppingCart className='size-3 shrink-0 text-primary' />
												)}
											</div>
											{who.length > 0 && (
												<span className='inline-flex min-w-0 items-center gap-1 truncate text-[11px] text-muted-foreground'>
													<Users className='size-2.5 shrink-0' />
													<span className='truncate'>{who.join(', ')}</span>
												</span>
											)}
										</div>
										{!isAvoid && (
											<span className='shrink-0 text-right'>
												{renderPrice(wish)}
											</span>
										)}
									</>
								)

								return (
									<li key={wish.id}>
										{clickable ? (
											<button
												type='button'
												onClick={() => onSelectFood?.(wish.foodId!)}
												className='flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-primary/5 sm:px-4'
											>
												{rowBody}
											</button>
										) : (
											<div className='flex items-center gap-2.5 px-3 py-1.5 sm:px-4'>
												{rowBody}
											</div>
										)}
									</li>
								)
							})}
						</ul>
					</section>
				))}

				{dishes.length > 0 && (
					<section>
						<header className='flex items-center gap-2 bg-muted/35 px-3 py-2 sm:px-4'>
							<span className='flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary'>
								<User className='size-3' />
							</span>
							<h3 className='text-xs font-semibold uppercase tracking-wide text-foreground'>
								{t('plan_board.individual')}
							</h3>
							<span className='text-xs tabular-nums text-muted-foreground'>
								{dishes.length}
							</span>
						</header>
						<ul className='divide-y divide-border/60'>
							{dishes.map(dish => (
								<li key={dish.key}>
									{onSelectFood ? (
										<button
											type='button'
											onClick={() => onSelectFood(dish.foodId)}
											className='flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-primary/5 sm:px-4'
										>
											<OrderThumb
												imageKey={dish.imageUrl}
												alt={dish.name}
												className='size-7 shrink-0 rounded-md'
											/>
											<div className='flex min-w-0 flex-1 flex-col'>
												<div className='flex min-w-0 items-center gap-1.5'>
													<span className='truncate text-xs font-medium text-foreground sm:text-sm'>
														{dish.name}
													</span>
													<span className='shrink-0 text-[11px] font-semibold tabular-nums text-primary'>
														×{dish.quantity}
													</span>
												</div>
												{dish.people.length > 0 && (
													<span className='truncate text-[11px] text-muted-foreground'>
														{dish.people.join(', ')}
													</span>
												)}
											</div>
										</button>
									) : (
										<div className='flex items-center gap-2.5 px-3 py-1.5 sm:px-4'>
											<OrderThumb
												imageKey={dish.imageUrl}
												alt={dish.name}
												className='size-7 shrink-0 rounded-md'
											/>
											<span className='truncate text-xs font-medium text-foreground sm:text-sm'>
												{dish.name}
											</span>
											<span className='shrink-0 text-[11px] font-semibold tabular-nums text-primary'>
												×{dish.quantity}
											</span>
										</div>
									)}
								</li>
							))}
						</ul>
					</section>
				)}

				{allergies.length > 0 && (
					<section className='flex flex-col gap-1 px-3 py-2.5 sm:px-4'>
						<div className='flex items-center gap-1.5 text-xs font-semibold text-destructive'>
							<ShieldAlert className='size-3.5 shrink-0' />
							<span>{t('plan_board.allergies')}</span>
						</div>
						<div className='flex flex-wrap gap-x-3 gap-y-1 text-xs'>
							{allergies.map(group => (
								<span key={group.key}>
									<span className='font-semibold text-destructive'>
										{labelOf(group)}
									</span>
									<span className='text-muted-foreground'>
										{' — '}
										{group.people.join(', ')}
									</span>
								</span>
							))}
						</div>
					</section>
				)}
			</div>

			{planned.length > 0 && (
				<footer className='flex items-center justify-between border-t border-border bg-muted/25 px-3 py-2.5 text-sm font-semibold text-foreground sm:px-4'>
					<span className='text-xs uppercase tracking-wide text-muted-foreground'>
						{t('table_plan.estimated_total')}
					</span>
					<span className='tabular-nums'>
						<TotalAmount
							amount={estimatedTotal}
							currency={currency}
							partial={partial}
						/>
					</span>
				</footer>
			)}
		</div>
	)
}
