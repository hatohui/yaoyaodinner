import { useTranslation } from 'react-i18next'
import { Flame, Plus } from 'lucide-react'
import type { WishKind } from '@/api/model'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import type { NewWish } from '@/hooks/useTableWishes'
import { useFoodPriceLabel, usePopularFoods } from './@usePopularFoods'

interface PlanQuickPicksProps {
	kind: WishKind
	plannedFoodIds: Set<string>
	onAdd: (wish: NewWish) => void
}

export function PlanQuickPicks({
	kind,
	plannedFoodIds,
	onAdd,
}: PlanQuickPicksProps) {
	const { t } = useTranslation()
	const priceOf = useFoodPriceLabel()
	const foods = usePopularFoods().filter(f => !plannedFoodIds.has(f.id))

	if (foods.length === 0) return null

	return (
		<section className='flex flex-col gap-2'>
			<h3 className='flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
				<Flame className='size-3.5 text-primary' />
				{t('plan_board.quick_picks', { list: t(`plan_board.${kind}`) })}
			</h3>
			<ul className='scrollbar-thin -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0'>
				{foods.map(food => (
					<li key={food.id} className='shrink-0 snap-start'>
						<button
							type='button'
							onClick={() =>
								onAdd({
									kind,
									variantId: food.defaultVariantId!,
									food,
								} as NewWish)
							}
							className='group flex w-32 cursor-pointer flex-col gap-1.5 rounded-2xl border border-border bg-card p-2 text-left shadow-xs transition-colors hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]'
						>
							<span className='relative'>
								<OrderThumb
									imageKey={food.imageUrl}
									alt={food.name}
									className='h-20 w-full rounded-xl'
								/>
								<span className='absolute right-1.5 bottom-1.5 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110'>
									<Plus className='size-4' />
								</span>
							</span>
							<span className='line-clamp-2 min-h-8 text-xs leading-4 font-medium text-foreground'>
								{food.name}
							</span>
							<span className='text-[11px] tabular-nums text-muted-foreground'>
								{priceOf(food)}
							</span>
						</button>
					</li>
				))}
			</ul>
		</section>
	)
}
