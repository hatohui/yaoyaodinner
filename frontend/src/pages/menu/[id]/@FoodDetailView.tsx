import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft, Share } from 'lucide-react'
import type { FoodDetailDto, FoodVariantDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { InlineEdit } from '@/components/common/InlineEdit'
import { useToast } from '@/hooks/useToast'
import { FoodTags } from '@/components/common/FoodTags'
import { useGuest } from '@/hooks/useGuest'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useEditMode } from '@/hooks/useEditMode'
import { ViewableImage } from '@/components/common/ViewableImage'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { cn } from '@/utils/shadcn'

interface FoodDetailViewProps {
	food: FoodDetailDto
	availableVariants: FoodVariantDto[]
	onAdd: () => void
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
	onAdd,
	onUpdateFood,
	onUpdateVariant,
	variant = 'page',
}: FoodDetailViewProps) {
	const { t } = useTranslation()
	const toast = useToast()
	const pin = useGuest(s => s.pin)
	const { isAdmin } = useIsAdmin()
	const { editing } = useEditMode()
	const canOrder = Boolean(pin) || isAdmin
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
			aria-label={t('roster.share')}
			className={cn(
				'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-control text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
				modal ? 'size-11' : 'px-3 py-1.5'
			)}
		>
			<Share className='size-4' />
			{!modal && t('roster.share')}
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
				<FoodTags
					isPopular={food.isPopular}
					isRecommended={food.isRecommended}
				/>
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
						{availableVariants.map(v => (
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
						))}
					</div>
				</div>
			)}
		</>
	)

	const actions = (
		<div className='flex flex-col gap-2'>
			<div className='flex items-center gap-2'>
				{modal && shareButton}
				<Button
					size='lg'
					className='h-11 flex-1 rounded-full'
					disabled={availableVariants.length === 0 || !canOrder}
					onClick={onAdd}
				>
					{t('food_detail.add_to_order')}
				</Button>
			</div>
			{!canOrder && (
				<p className='text-center text-xs text-muted-foreground'>
					{t('menu.pin_required')}
				</p>
			)}
		</div>
	)

	if (modal) {
		return (
			<div className='grid md:h-[min(85vh,34rem)] md:grid-cols-[1.1fr_1fr]'>
				{image}
				<div className='flex min-h-0 flex-col'>
					<div className='scrollbar-thin flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6'>
						{details}
					</div>
					<div className='border-t border-border bg-background p-4 sm:px-6'>
						{actions}
					</div>
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
