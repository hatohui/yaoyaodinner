import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Check, UtensilsCrossed } from 'lucide-react'
import type { FoodItemDto } from '@/api/model'
import { FoodTags } from '@/components/common/FoodTags'
import { StoredImage } from '@/components/common/StoredImage'
import { usePrefetchFood } from '@/hooks/usePrefetchFood'
import { cn } from '@/utils/shadcn'
import { FoodPrice } from './@FoodPrice'
import { AddControl } from './@AddControl'

interface FoodRowProps {
	food: FoodItemDto
	categoryName?: string
	quantity?: number
	orderedQuantity?: number
	onAdd?: () => void
	onQuantityChange?: (quantity: number) => void
	onQuickView?: (id: string) => void
}

/** Dense list layout of a menu item: thumbnail, details, add control. */
export function FoodRow({
	food,
	categoryName,
	quantity = 0,
	orderedQuantity = 0,
	onAdd,
	onQuantityChange,
	onQuickView,
}: FoodRowProps) {
	const { t } = useTranslation()
	const prefetchFood = usePrefetchFood()
	const prefetch = () => prefetchFood(food.id)

	const handleClick = (e: MouseEvent) => {
		if (!onQuickView) return
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
		if (!window.matchMedia('(min-width: 640px)').matches) return
		e.preventDefault()
		onQuickView(food.id)
	}

	const canAdd =
		Boolean(onAdd) && food.isAvailable && Boolean(food.defaultVariantId)

	return (
		<Link
			to={`/menu/${food.id}`}
			onClick={handleClick}
			onPointerEnter={prefetch}
			onTouchStart={prefetch}
			onFocus={prefetch}
			className={cn(
				'group flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-sm transition-colors hover:border-primary/40',
				!food.isAvailable && 'opacity-70',
				quantity > 0 && 'ring-2 ring-primary'
			)}
		>
			<span className='flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground'>
				<StoredImage
					imageKey={food.imageUrl}
					alt={food.name}
					className='size-full object-cover'
					fallback={<UtensilsCrossed className='size-6' />}
				/>
			</span>

			<span className='flex min-w-0 flex-1 flex-col gap-0.5'>
				<FoodTags
					isPopular={food.isPopular}
					isRecommended={food.isRecommended}
				/>
				{categoryName && (
					<span className='truncate text-[11px] font-semibold uppercase tracking-wide text-primary'>
						{categoryName}
					</span>
				)}
				<span
					title={food.name}
					className='truncate text-sm font-semibold leading-snug text-foreground group-hover:text-primary'
				>
					{food.name}
				</span>
				<span className='flex flex-wrap items-center gap-x-2'>
					<FoodPrice food={food} />
					{!food.isAvailable ? (
						<span className='text-xs font-semibold text-destructive'>
							{t('menu.unavailable')}
						</span>
					) : (
						orderedQuantity > 0 && (
							<span className='flex items-center gap-1 text-xs font-medium text-muted-foreground'>
								<Check className='size-3.5 text-primary' />
								{t('orders.ordered_count', { count: orderedQuantity })}
							</span>
						)
					)}
				</span>
			</span>

			{canAdd && (
				<AddControl
					quantity={quantity}
					onAdd={onAdd}
					onQuantityChange={onQuantityChange}
				/>
			)}
		</Link>
	)
}
