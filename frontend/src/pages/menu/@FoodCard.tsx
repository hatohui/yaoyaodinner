import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Check, Eye, EyeOff, Trash2 } from 'lucide-react'
import type { FoodItemDto } from '@/api/model'
import { Badge } from '@/components/ui/badge'
import { FoodTags } from '@/components/common/FoodTags'
import { cn } from '@/utils/shadcn'
import { StoredImage } from '@/components/common/StoredImage'
import { FoodImageButton } from './@FoodImageButton'
import { FoodPrice } from './@FoodPrice'
import { AddControl } from './@AddControl'
import { usePrefetchFood } from '@/hooks/usePrefetchFood'

interface FoodCardProps {
	food: FoodItemDto
	categoryName?: string
	quantity?: number
	orderedQuantity?: number
	onAdd?: () => void
	onQuantityChange?: (quantity: number) => void
	onQuickView?: (id: string) => void
	onToggleAvailable?: () => void
	onDelete?: () => void
	onImageChange?: (key: string) => void
}

export function FoodCard({
	food,
	categoryName,
	quantity = 0,
	orderedQuantity = 0,
	onAdd,
	onQuantityChange,
	onQuickView,
	onToggleAvailable,
	onDelete,
	onImageChange,
}: FoodCardProps) {
	const { t } = useTranslation()
	const prefetchFood = usePrefetchFood()
	const prefetch = () => prefetchFood(food.id)

	const handleLinkClick = (e: MouseEvent) => {
		if (!onQuickView) return
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
		if (!window.matchMedia('(min-width: 640px)').matches) return
		e.preventDefault()
		onQuickView(food.id)
	}

	const isEditing = Boolean(onToggleAvailable || onDelete || onImageChange)

	const canAdd =
		Boolean(onAdd) && food.isAvailable && Boolean(food.defaultVariantId)

	return (
		<div
			className={cn(
				'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md',
				'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
				!food.isAvailable && 'opacity-70',
				quantity > 0 && 'ring-2 ring-primary',
				isEditing &&
					'outline-2 outline-offset-2 outline-primary/60 outline-dashed'
			)}
		>
			<Link
				to={`/menu/${food.id}`}
				onClick={handleLinkClick}
				onPointerEnter={prefetch}
				onTouchStart={prefetch}
				onFocus={prefetch}
				className='relative aspect-[4/3] overflow-hidden border-b border-border bg-muted'
			>
				<StoredImage
					imageKey={food.imageUrl}
					alt={food.name}
					className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
					fallback={
						<div className='flex h-full w-full items-center justify-center bg-secondary/70'>
							<span className='text-5xl'>🍽️</span>
						</div>
					}
				/>

				<div className='absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

				{(food.isPopular || food.isRecommended) && (
					// keeps the tags readable on bright or busy photos
					<div className='pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent' />
				)}
				<FoodTags
					isPopular={food.isPopular}
					isRecommended={food.isRecommended}
					className='absolute left-2 top-2 max-w-[calc(100%-1rem)]'
				/>

				{!food.isAvailable && (
					<div className='absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]'>
						<Badge
							variant='destructive'
							className='px-3 py-1 text-sm font-semibold shadow-lg'
						>
							{t('menu.unavailable')}
						</Badge>
					</div>
				)}

				{orderedQuantity > 0 && !isEditing && (
					<span className='absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs font-semibold text-foreground shadow-md backdrop-blur-sm'>
						<Check className='size-3.5 text-primary' />
						{t('orders.ordered_count', { count: orderedQuantity })}
					</span>
				)}
			</Link>

			{isEditing && (
				<div className='pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[4/3]'>
					{onImageChange && (
						<FoodImageButton
							onChange={onImageChange}
							className='pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
						/>
					)}
					<div className='pointer-events-auto absolute bottom-2 left-2 flex gap-1.5'>
						{onToggleAvailable && (
							<button
								type='button'
								aria-label={
									food.isAvailable ? t('menu.admin.hide') : t('menu.admin.show')
								}
								title={
									food.isAvailable ? t('menu.admin.hide') : t('menu.admin.show')
								}
								onClick={onToggleAvailable}
								className='flex size-8 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground'
							>
								{food.isAvailable ? (
									<EyeOff className='size-4' />
								) : (
									<Eye className='size-4' />
								)}
							</button>
						)}
						{onDelete && (
							<button
								type='button'
								aria-label={t('menu.admin.delete')}
								title={t('menu.admin.delete')}
								onClick={onDelete}
								className='flex size-8 items-center justify-center rounded-full bg-destructive text-primary-foreground shadow-md transition-all hover:scale-110'
							>
								<Trash2 className='size-4' />
							</button>
						)}
					</div>
				</div>
			)}

			<Link
				to={`/menu/${food.id}`}
				onClick={handleLinkClick}
				onPointerEnter={prefetch}
				onTouchStart={prefetch}
				onFocus={prefetch}
				className='flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3'
			>
				{categoryName && (
					<span className='truncate text-[11px] font-semibold uppercase tracking-wide text-primary'>
						{categoryName}
					</span>
				)}
				<h3
					title={food.name}
					className='line-clamp-2 min-h-[2lh] text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base'
				>
					{food.name}
				</h3>
				<div className='mt-auto flex items-end justify-between gap-2 pt-2'>
					<FoodPrice food={food} />
					{canAdd && (
						<AddControl
							quantity={quantity}
							onAdd={onAdd}
							onQuantityChange={onQuantityChange}
						/>
					)}
				</div>
			</Link>
		</div>
	)
}
