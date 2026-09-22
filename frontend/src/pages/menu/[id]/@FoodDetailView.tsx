import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft, Share } from 'lucide-react'
import type { FoodDetailDto, FoodVariantDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { ASSET_URL } from '@/common/app'
import { InlineEdit } from '@/components/common/InlineEdit'
import { useToast } from '@/hooks/useToast'
import { FoodTags } from '@/components/common/FoodTags'

interface FoodDetailViewProps {
	food: FoodDetailDto
	availableVariants: FoodVariantDto[]
	onAdd: () => void
	onUpdateFood: (patch: { name?: string; description?: string }) => void
	onUpdateVariant: (
		variantId: string,
		patch: { label?: string; price?: number }
	) => void
	hideBackLink?: boolean
}

export function FoodDetailView({
	food,
	availableVariants,
	onAdd,
	onUpdateFood,
	onUpdateVariant,
	hideBackLink,
}: FoodDetailViewProps) {
	const { t } = useTranslation()
	const [imgError, setImgError] = useState(false)
	const toast = useToast()

	const imageSrc =
		food.imageUrl && !imgError
			? food.imageUrl.startsWith('http')
				? food.imageUrl
				: `${ASSET_URL}/${food.imageUrl}`
			: null

	return (
		<div className='mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6'>
			<div className='flex items-center justify-between'>
				{hideBackLink ? (
					<span />
				) : (
					<Link
						to='/menu'
						className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
					>
						<ArrowLeft className='size-4' />
						{t('food_detail.back_to_menu')}
					</Link>
				)}
				<button
					onClick={() => {
						navigator.clipboard.writeText(window.location.href)
						toast.success('Link copied to clipboard')
					}}
					className='inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
				>
					<Share className='size-4' />
					Share
				</button>
			</div>

			<div className='overflow-hidden rounded-2xl bg-muted'>
				{imageSrc ? (
					<img
						src={imageSrc}
						alt={food.name}
						className='aspect-[4/3] w-full object-cover'
						onError={() => setImgError(true)}
					/>
				) : (
					<div className='flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-brand-muted to-muted'>
						<span className='text-6xl'>🍽️</span>
					</div>
				)}
			</div>

			<div className='space-y-1.5'>
				<FoodTags
					isPopular={food.isPopular}
					isRecommended={food.isRecommended}
				/>
				<h1 className='text-2xl font-bold text-foreground'>
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
								className='flex items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground'
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
								{v.currency}
							</span>
						))}
					</div>
				</div>
			)}

			<Button
				size='lg'
				className='rounded-full'
				disabled={availableVariants.length === 0}
				onClick={onAdd}
			>
				{t('food_detail.add_to_order')}
			</Button>
		</div>
	)
}
