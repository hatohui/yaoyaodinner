import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Check, Eye, EyeOff, Minus, Plus, Trash2 } from 'lucide-react'
import type { FoodItemDto } from '@/api/model'
import { Badge } from '@/components/ui/badge'
import { FoodTags } from '@/components/common/FoodTags'
import { cn } from '@/utils/shadcn'
import { StoredImage } from '@/components/common/StoredImage'
import { FoodImageButton } from './@FoodImageButton'

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

	const handleLinkClick = (e: MouseEvent) => {
		if (!onQuickView) return
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
		if (!window.matchMedia('(min-width: 640px)').matches) return
		e.preventDefault()
		onQuickView(food.id)
	}

	const hasPrice = food.price !== null && food.price !== undefined

	const isEditing = Boolean(onToggleAvailable || onDelete || onImageChange)

	const canAdd =
		Boolean(onAdd) && food.isAvailable && Boolean(food.defaultVariantId)

	// controls sit inside the card's link, so they must not navigate
	const press = (action?: () => void) => (e: MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		action?.()
	}

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
				className='relative aspect-[4/3] overflow-hidden bg-muted'
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

				<FoodTags
					isPopular={food.isPopular}
					isRecommended={food.isRecommended}
					className={cn(
						'absolute left-2 top-2',
						quantity > 0
							? 'max-w-[calc(100%-7.5rem)]'
							: 'max-w-[calc(100%-3.5rem)]'
					)}
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

				{hasPrice && (
					<span className='absolute bottom-2 right-2 rounded-full bg-card/90 px-2.5 py-1 text-sm font-bold tabular-nums text-foreground shadow-md backdrop-blur-sm'>
						{food.price}{' '}
						<span className='text-xs font-semibold text-primary'>
							{food.currency}
						</span>
					</span>
				)}

				{orderedQuantity > 0 && !isEditing && (
					<span className='absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs font-semibold text-foreground shadow-md backdrop-blur-sm'>
						<Check className='size-3.5 text-primary' />
						{t('orders.ordered_count', { count: orderedQuantity })}
					</span>
				)}

				{canAdd &&
					(quantity === 0 ? (
						<button
							type='button'
							aria-label={t('orders.add')}
							title={t('orders.add')}
							onClick={press(onAdd)}
							className='absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border-2 border-primary/70 bg-card text-primary shadow-md ring-1 ring-black/10 transition-all hover:scale-110 hover:border-primary hover:bg-primary hover:text-primary-foreground'
						>
							<Plus className='size-4' strokeWidth={3} />
						</button>
					) : (
						<div className='absolute right-2 top-2 flex items-center rounded-full bg-primary text-primary-foreground shadow-md ring-1 ring-background/70'>
							<button
								type='button'
								aria-label={t('orders.decrease')}
								onClick={press(() => onQuantityChange?.(quantity - 1))}
								className='flex size-8 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/15'
							>
								<Minus className='size-4' strokeWidth={3} />
							</button>
							<span className='min-w-4 text-center text-sm font-bold tabular-nums'>
								{quantity}
							</span>
							<button
								type='button'
								aria-label={t('orders.increase')}
								onClick={press(() => onQuantityChange?.(quantity + 1))}
								className='flex size-8 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/15'
							>
								<Plus className='size-4' strokeWidth={3} />
							</button>
						</div>
					))}
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
				className='flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3'
			>
				{categoryName && (
					<span className='truncate text-[11px] font-semibold uppercase tracking-wide text-primary'>
						{categoryName}
					</span>
				)}
				<h3 className='line-clamp-2 min-h-[2lh] text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base'>
					{food.name}
				</h3>
				<p className='hidden min-h-[2lh] text-sm leading-snug text-muted-foreground sm:line-clamp-2'>
					{food.description}
				</p>
			</Link>
		</div>
	)
}
