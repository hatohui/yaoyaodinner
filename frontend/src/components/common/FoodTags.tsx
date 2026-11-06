import { useTranslation } from 'react-i18next'
import { Flame, Sparkles } from 'lucide-react'
import { cn } from '@/utils/shadcn'

interface FoodTagsProps {
	isPopular?: boolean
	isRecommended?: boolean
	className?: string
}

export function FoodTags({
	isPopular,
	isRecommended,
	className,
}: FoodTagsProps) {
	const { t } = useTranslation()

	if (!isPopular && !isRecommended) return null

	const base =
		'flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-md'

	return (
		<div className={cn('flex flex-wrap items-center gap-1.5', className)}>
			{isPopular && (
				<span
					className={cn(
						base,
						'border-primary-foreground/30 bg-primary text-primary-foreground'
					)}
				>
					<Flame className='size-3.5' />
					{t('menu.popular')}
				</span>
			)}
			{isRecommended && (
				<span className={cn(base, 'border-primary/40 bg-card text-primary')}>
					<Sparkles className='size-3.5' />
					{t('menu.recommended')}
				</span>
			)}
		</div>
	)
}
