import { useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Check } from 'lucide-react'
import type { FoodItemDto } from '@/api/model'
import { Badge } from '@/components/ui/badge'
import { FoodTags } from '@/components/common/FoodTags'
import { cn } from '@/utils/shadcn'
import { ASSET_URL } from '@/common/app'

interface FoodCardProps {
	food: FoodItemDto
	selected?: boolean
	onToggleSelect?: () => void
	onQuickView?: (id: string) => void
}

export function FoodCard({
	food,
	selected = false,
	onToggleSelect,
	onQuickView,
}: FoodCardProps) {
	const { t } = useTranslation()
	const [imgError, setImgError] = useState(false)

	const handleLinkClick = (e: MouseEvent) => {
		if (!onQuickView) return
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
		if (!window.matchMedia('(min-width: 640px)').matches) return
		e.preventDefault()
		onQuickView(food.id)
	}

	const imageSrc =
		food.imageUrl && !imgError
			? food.imageUrl.startsWith('http')
				? food.imageUrl
				: `${ASSET_URL}/${food.imageUrl}`
			: null

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
				{imageSrc ? (
					<img
						src={imageSrc}
						alt={food.name}
						className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
						onError={() => setImgError(true)}
					/>
				) : (
					<div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-muted to-muted'>
						<span className='text-5xl'>🍽️</span>
					</div>
				)}

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
							'absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border shadow backdrop-blur-sm transition-all',
							selected
								? 'border-primary bg-primary text-primary-foreground opacity-100'
								: 'border-border/60 bg-background/80 text-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
						)}
					>
						<Check className='size-4' />
					</button>
				)}
			</Link>

			<Link
				to={`/menu/${food.id}`}
				onClick={handleLinkClick}
				className='flex flex-1 flex-col gap-1 p-4'
			>
				<h3 className='line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary'>
					{food.name}
				</h3>
				{food.description && (
					<p className='hidden line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:block'>
						{food.description}
					</p>
				)}
				{food.price !== null && food.price !== undefined && (
					<p className='mt-auto text-sm font-medium text-primary'>
						{food.price} {food.currency}
					</p>
				)}
			</Link>
		</div>
	)
}
