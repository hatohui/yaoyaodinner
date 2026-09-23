import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import type { FoodItemDto } from '@/api/model'
import { StoredImage } from '@/components/common/StoredImage'
import { Button } from '@/components/ui/button'
import { FoodTags } from '@/components/common/FoodTags'

interface ProductCardProps {
	food: FoodItemDto
	quantity: number
	onAdd: () => void
	onQuantityChange: (quantity: number) => void
}

export function ProductCard({
	food,
	quantity,
	onAdd,
	onQuantityChange,
}: ProductCardProps) {
	const { t } = useTranslation()

	return (
		<div className='flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md'>
			<div className='relative aspect-[4/3] w-full overflow-hidden bg-muted'>
				<StoredImage
					imageKey={food.imageUrl}
					alt={food.name}
					className='size-full object-cover'
					fallback={
						<div className='flex size-full items-center justify-center bg-gradient-to-br from-brand-muted to-muted text-4xl'>
							🍽️
						</div>
					}
				/>

				<FoodTags
					isPopular={food.isPopular}
					isRecommended={food.isRecommended}
					className='absolute left-2 top-2 max-w-[calc(100%-1rem)]'
				/>
			</div>

			<div className='flex flex-1 flex-col gap-2 p-3'>
				<span className='line-clamp-2 text-sm font-medium text-foreground'>
					{food.name}
				</span>

				<div className='mt-auto flex items-center justify-between gap-2'>
					<span className='text-sm font-semibold text-primary'>
						{food.shouldCalculate
							? `${food.price ?? 0} ${food.currency ?? ''}`
							: t('orders.free')}
					</span>

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
						<div className='flex items-center gap-1 rounded-full border border-border/60'>
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
	)
}
