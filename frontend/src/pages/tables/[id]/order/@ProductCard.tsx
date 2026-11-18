import { useTranslation } from 'react-i18next'
import { Check, Minus, Plus, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import type { FoodItemDto, WishKind } from '@/api/model'
import { StoredImage } from '@/components/common/StoredImage'
import { Button } from '@/components/ui/button'
import { FoodTags } from '@/components/common/FoodTags'
import type { ReactNode } from 'react'
import { cn } from '@/utils/shadcn'

interface ProductCardProps {
	food: FoodItemDto
	quantity: number
	orderedQuantity: number
	onAdd: () => void
	onQuantityChange: (quantity: number) => void
	onQuickView?: () => void
	wishKind?: WishKind
	wishMenu?: ReactNode
}

export function ProductCard({
	food,
	quantity,
	orderedQuantity,
	onAdd,
	onQuantityChange,
	onQuickView,
	wishKind,
	wishMenu,
}: ProductCardProps) {
	const { t } = useTranslation()

	const photo = (
		<StoredImage
			imageKey={food.imageUrl}
			alt={food.name}
			className='size-full object-cover'
			fallback={
				<div className='flex size-full items-center justify-center bg-secondary/70 text-muted-foreground'>
					<UtensilsCrossed className='size-8' />
				</div>
			}
		/>
	)

	return (
		<div
			className={cn(
				'flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
				quantity > 0 && 'border-primary ring-2 ring-primary/40'
			)}
		>
			<div className='relative aspect-[4/3] w-full overflow-hidden border-b border-border bg-muted'>
				{onQuickView ? (
					<button
						type='button'
						onClick={onQuickView}
						aria-label={food.name}
						className='block size-full cursor-pointer transition-transform duration-300 hover:scale-105'
					>
						{photo}
					</button>
				) : (
					photo
				)}

				<FoodTags
					isPopular={food.isPopular}
					isRecommended={food.isRecommended}
					isAiTranslated={food.isAiTranslated}
					wishKind={wishKind}
					className='pointer-events-none absolute left-2 top-2 max-w-[calc(100%-1rem)]'
				/>

				<div className='pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap justify-end gap-1.5'>
					{orderedQuantity > 0 && (
						<span className='flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold text-foreground shadow backdrop-blur-sm'>
							<Check className='size-3.5 text-primary' />
							{t('orders.ordered_count', { count: orderedQuantity })}
						</span>
					)}
					{quantity > 0 && (
						<span className='flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow'>
							<ShoppingCart className='size-3.5' />
							{t('orders.in_cart_count', { count: quantity })}
						</span>
					)}
				</div>
			</div>

			<div className='flex flex-1 flex-col gap-2 p-2.5 sm:p-3'>
				{onQuickView ? (
					<button
						type='button'
						onClick={onQuickView}
						className='line-clamp-2 w-fit max-w-full cursor-pointer text-left text-xs font-medium text-foreground transition-colors hover:text-primary sm:text-sm'
					>
						{food.name}
					</button>
				) : (
					<span className='line-clamp-2 text-xs font-medium text-foreground sm:text-sm'>
						{food.name}
					</span>
				)}

				<div className='mt-auto flex items-center justify-between gap-1.5 sm:gap-2'>
					<span className='text-xs font-semibold text-primary sm:text-sm'>
						{!food.shouldCalculate
							? t('orders.free')
							: food.price != null && food.price > 0
								? `${food.price} ${food.currency ?? ''}`
								: t('menu.seasonal_price')}
					</span>

					<div className='flex items-center gap-1.5'>
						{wishMenu}
						{quantity === 0 ? (
							<Button
								size='sm'
								className='gap-1 rounded-full'
								disabled={!food.defaultVariantId}
								onClick={onAdd}
							>
								<Plus className='size-3.5' />
								{t('orders.add')}
							</Button>
						) : (
							<div className='flex items-center gap-1 rounded-full border border-border bg-control'>
								<button
									type='button'
									onClick={() => onQuantityChange(quantity - 1)}
									aria-label={t('orders.decrease')}
									className='flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
								>
									<Minus className='size-3.5' />
								</button>
								<span className='min-w-5 text-center text-sm font-medium text-foreground'>
									{quantity}
								</span>
								<button
									type='button'
									onClick={() => onQuantityChange(quantity + 1)}
									aria-label={t('orders.increase')}
									className='flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
								>
									<Plus className='size-3.5' />
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
