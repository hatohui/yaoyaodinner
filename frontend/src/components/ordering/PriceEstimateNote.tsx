import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { hasUnpriced, type Priced } from '@/utils/money'
import { cn } from '@/utils/shadcn'

interface PriceEstimateNoteProps {
	lines: Priced[]
	className?: string
}

export function PriceEstimateNote({
	lines,
	className,
}: PriceEstimateNoteProps) {
	const { t } = useTranslation()

	return (
		<p
			className={cn(
				'm-0 flex gap-2 text-xs leading-relaxed text-muted-foreground',
				className
			)}
		>
			<Info className='mt-0.5 size-3.5 shrink-0' />
			<span>
				{t('orders.estimate_note')}
				{hasUnpriced(lines) && ` ${t('orders.unpriced_note')}`}
			</span>
		</p>
	)
}
