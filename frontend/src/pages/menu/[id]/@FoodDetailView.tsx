import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft, Link as LinkIcon, ShoppingCart, Users } from 'lucide-react'
import type { FoodDetailWithStatsDto, FoodVariantDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { InlineEdit } from '@/components/common/InlineEdit'
import { useToast } from '@/hooks/useToast'
import { FoodTags } from '@/components/common/FoodTags'
import { useGuest } from '@/hooks/useGuest'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import { useStageTitle } from '@/hooks/useStageTitle'
import { useEditMode } from '@/hooks/useEditMode'
import { ViewableImage } from '@/components/common/ViewableImage'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { cn } from '@/utils/shadcn'

interface FoodDetailViewProps {
	food: FoodDetailWithStatsDto
	availableVariants: FoodVariantDto[]
	selectedVariantId: string | null
	onSelectVariant: (variantId: string) => void
	onAddToCart: () => void
	onUpdateFood: (patch: {
		name?: string
		description?: string
		imageUrl?: string | null
	}) => void
	onUpdateVariant: (
		variantId: string,
		patch: { label?: string; price?: number }
	) => void
	/** Modal: side-by-side on desktop, no back link, actions pinned to the bottom. */
	variant?: 'page' | 'modal'
}

export function FoodDetailView({
	food,
	availableVariants,
	selectedVariantId,
	onSelectVariant,
	onAddToCart,
	onUpdateFood,
	onUpdateVariant,
	variant = 'page',
}: FoodDetailViewProps) {
	const { t } = useTranslation()
	const toast = useToast()
	const pin = useGuest(s => s.pin)
	const { isAdmin } = useIsAdmin()
	const { editing } = useEditMode()
	const { canAdd } = useOrderingStage()
	const stageTitle = useStageTitle()
	const hasAccess = Boolean(pin) || isAdmin
	const canOrder = hasAccess && canAdd
	const modal = variant === 'modal'

	const shareLink = () => {
		navigator.clipboard.writeText(
			`${window.location.origin}/menu/${food.id}${window.location.search}`
		)
		toast.success(t('roster.link_copied'))
	}

	const shareButton = (
		<button
			type='button'
			onClick={shareLink}
			aria-label={t('roster.copy_link')}
			className={cn(
				'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-control text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
				modal ? 'size-11' : 'px-3 py-1.5'
			)}
		>
			<LinkIcon className='size-4' />
			{!modal && t('roster.copy_link')}
		</button>
	)

	const image = editing ? (
		<ImageUploadSlot
			shape='banner'
			folder='foods'
			aspect={4 / 3}
			imageKey={food.imageUrl}
			onChange={imageUrl => onUpdateFood({ imageUrl })}
			className={cn(
				'aspect-[4/3] h-auto',
				modal && 'rounded-none border-0 md:aspect-auto md:h-full'
			)}
		/>
	) : (
		<div
			className={cn(
				'overflow-hidden bg-muted',
				modal ? 'md:h-full' : 'rounded-2xl'
			)}
		>
			<ViewableImage
				imageKey={food.imageUrl}
				alt={food.name}
				className={cn('w-full', modal && 'md:h-full')}
				imgClassName={cn(
					'aspect-[4/3] w-full object-cover',
					modal && 'md:aspect-auto md:h-full'
				)}
				fallback={
					<div
						className={cn(
							'flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10',
							modal && 'md:aspect-auto md:h-full'
						)}
					>
						<span className='text-6xl'>🍽️</span>
					</div>
				}
			/>
		</div>
	)

	const details = (
		<>
			<div className='space-y-1.5'>
				<div className='flex flex-wrap items-center gap-1.5'>
					<FoodTags
						isPopular={food.isPopular}
						isRecommended={food.isRecommended}
					/>
					{food.orderedBy > 0 && (
						<span className='flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary'>
							<Users className='size-3.5' />
							{t('food_detail.ordered_by', { count: food.orderedBy })}
						</span>
					)}
				</div>
				<h1
					className={cn(
						'font-bold leading-tight text-foreground',
						modal ? 'pr-8 text-xl sm:text-2xl' : 'text-2xl'
					)}
				>
					<InlineEdit
						value={food.name}
						onCommit={name =>
							name.trim() && onUpdateFood({ name: name.trim() })
						}
					/>
				</h1>
				<p className='text-sm leading-relaxed text-muted-foreground'>
					<InlineEdit
						value={food.description ?? ''}
						placeholder={t('food_detail.description_placeholder')}
						onCommit={description => onUpdateFood({ description })}
					/>
				</p>
				{!food.isAvailable && (
					<p className='text-sm font-medium text-destructive'>
						{t('menu.unavailable')}
					</p>
				)}
			</div>

			{availableVariants.length > 0 && (
				<div className='flex flex-col gap-2'>
					<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
						{t('food_detail.variants')}
					</p>
					<div className='flex flex-wrap gap-2'>
						{availableVariants.map(v =>
							editing ? (
								<span
									key={v.id}
									className='flex items-center gap-1 rounded-full border border-border bg-control px-4 py-2 text-sm font-medium text-foreground'
								>
									<InlineEdit
										value={v.label ?? ''}
										onCommit={label => onUpdateVariant(v.id, { label })}
										inputClassName='w-28'
									/>
									<span className='text-muted-foreground'>-</span>
									<InlineEdit
										type='number'
										value={String(v.price ?? '')}
										onCommit={price =>
											onUpdateVariant(v.id, { price: Number(price) })
										}
										inputClassName='w-20'
									/>
									<span className='text-primary'>{v.currency}</span>
								</span>
							) : canOrder ? (
								<button
									key={v.id}
									type='button'
									aria-pressed={v.id === selectedVariantId}
									onClick={() => onSelectVariant(v.id)}
									className={cn(
										'flex cursor-pointer items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
										v.id === selectedVariantId
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-border bg-control text-foreground hover:border-primary/40 hover:bg-primary/10'
									)}
								>
									{v.label}
									<span className='opacity-60'>-</span>
									{v.price}
									<span
										className={cn(v.id !== selectedVariantId && 'text-primary')}
									>
										{v.currency}
									</span>
								</button>
							) : (
								<span
									key={v.id}
									className='flex items-center gap-1 rounded-full border border-border bg-control px-4 py-2 text-sm font-medium text-foreground'
								>
									{v.label}
									<span className='text-muted-foreground'>-</span>
									{v.price}
									<span className='text-primary'>{v.currency}</span>
								</span>
							)
						)}
					</div>
				</div>
			)}
		</>
	)

	const actions = hasAccess ? (
		<div className='flex flex-col gap-2'>
			<div className='flex items-center gap-2'>
				<Button
					size='lg'
					className='h-11 flex-1 gap-2 rounded-full'
					disabled={availableVariants.length === 0 || !canOrder}
					onClick={onAddToCart}
				>
					<ShoppingCart className='size-4' />
					{t('food_detail.add_to_cart')}
				</Button>
				{modal && shareButton}
			</div>
			{!canOrder && (
				<p className='text-center text-xs text-muted-foreground'>
					{stageTitle}
				</p>
			)}
		</div>
	) : modal ? (
		<div className='flex justify-end'>{shareButton}</div>
	) : null

	if (modal) {
		return (
			<div className='grid md:h-[min(85vh,34rem)] md:grid-cols-[1.1fr_1fr]'>
				{image}
				<div className='flex min-h-0 flex-col'>
					<div className='scrollbar-thin flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6'>
						{details}
					</div>
					{actions && (
						<div className='border-t border-border bg-background p-4 sm:px-6'>
							{actions}
						</div>
					)}
				</div>
			</div>
		)
	}

	return (
		<div className='mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6'>
			<div className='flex items-center justify-between'>
				<Link
					to='/menu'
					className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
				>
					<ArrowLeft className='size-4' />
					{t('food_detail.back_to_menu')}
				</Link>
				{shareButton}
			</div>
			{image}
			{details}
			{actions}
		</div>
	)
}
