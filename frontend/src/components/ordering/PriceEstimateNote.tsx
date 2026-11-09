import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { cn } from '@/utils/shadcn'

export function PriceEstimateNote({ className }: { className?: string }) {
	const { t } = useTranslation()

	return (
		<p
			className={cn(
				'm-0 flex items-center gap-2 text-xs text-muted-foreground',
				className
			)}
		>
			<Info className='size-3.5 shrink-0' />
			{t('orders.estimate_note')}
		</p>
	)
}
