import { useTranslation } from 'react-i18next'
import { Ban, Flame, Languages, Sparkles, Star } from 'lucide-react'
import type { WishKind } from '@/api/model'
import { cn } from '@/utils/shadcn'
import { useConfig } from '@/hooks/useConfig'

interface FoodTagsProps {
	isPopular?: boolean
	isRecommended?: boolean
	isAiTranslated?: boolean
	wishKind?: WishKind
	className?: string
}

export function FoodTags({
	isPopular,
	isRecommended,
	isAiTranslated,
	wishKind,
	className,
}: FoodTagsProps) {
	const { t } = useTranslation()
	const { recommended } = useConfig()
	const showRecommended = isRecommended && recommended

	if (!isPopular && !showRecommended && !isAiTranslated && !wishKind)
		return null

	const base =
		'flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-md'

	return (
		<div className={cn('flex flex-wrap items-center gap-1.5', className)}>
			{wishKind === 'must' && (
				<span
					className={cn(
						base,
						'border-primary/40 bg-primary text-primary-foreground'
					)}
				>
					<Star className='size-3.5 fill-current' />
					{t('plan_board.must')}
				</span>
			)}
			{wishKind === 'want' && (
				<span className={cn(base, 'border-primary/40 bg-card text-primary')}>
					<Sparkles className='size-3.5' />
					{t('plan_board.want')}
				</span>
			)}
			{wishKind === 'avoid' && (
				<span
					className={cn(
						base,
						'border-destructive/40 bg-destructive text-primary-foreground'
					)}
				>
					<Ban className='size-3.5' />
					{t('plan_board.avoid')}
				</span>
			)}
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
			{showRecommended && (
				<span className={cn(base, 'border-primary/40 bg-card text-primary')}>
					<Sparkles className='size-3.5' />
					{t('menu.recommended')}
				</span>
			)}
			{isAiTranslated && (
				<span
					title={t('menu.ai_translated_hint')}
					className={cn(base, 'border-border bg-card text-muted-foreground')}
				>
					<Languages className='size-3.5' />
					{t('menu.ai_translated')}
				</span>
			)}
		</div>
	)
}
