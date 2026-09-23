import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Check, Plus } from 'lucide-react'
import type { FoodItemDto } from '@/api/model'
import { Badge } from '@/components/ui/badge'
import { FoodTags } from '@/components/common/FoodTags'
import { cn } from '@/utils/shadcn'
import { StoredImage } from '@/components/common/StoredImage'

interface FoodCardProps {
	food: FoodItemDto
	categoryName?: string
	selected?: boolean
	onToggleSelect?: () => void
	onQuickView?: (id: string) => void
}

export function FoodCard({
	food,
	categoryName,
	selected = false,
	onToggleSelect,
	onQuickView,
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

	const canSelect =
		Boolean(onToggleSelect) &&
		food.isAvailable &&
		Boolean(food.defaultVariantId)

	return (
		<div
			className={cn(
				'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md',
				'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
				!food.isAvailable && 'opacity-70',
				selected && 'ring-2 ring-primary'
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
						<div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10'>
							<span className='text-5xl'>🍽️</span>
						</div>
					}
				/>

				<div className='absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

				<FoodTags
					isPopular={food.isPopular}
					isRecommended={food.isRecommended}
					className='absolute left-2 top-2 max-w-[calc(100%-3.5rem)]'
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

				{canSelect && (
					<button
						type='button'
						aria-label={t('menu.select_item')}
						aria-pressed={selected}
						onClick={e => {
							e.preventDefault()
							e.stopPropagation()
							onToggleSelect?.()
						}}
						className={cn(
							'absolute right-2 top-2 flex size-8 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all hover:scale-110',
							selected
								? 'bg-primary text-primary-foreground'
								: 'bg-card/90 text-primary hover:bg-primary hover:text-primary-foreground'
						)}
					>
						{selected ? (
							<Check className='size-4' strokeWidth={3} />
						) : (
							<Plus className='size-4' strokeWidth={3} />
						)}
					</button>
				)}
			</Link>

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
