import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { cn } from '@/utils/shadcn'

export function OrderingClosedNotice({ className }: { className?: string }) {
	const { t } = useTranslation()

	return (
		<div
			className={cn(
				'flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3',
				className
			)}
		>
			<span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary'>
				<Clock className='size-4' />
			</span>
			<div className='flex min-w-0 flex-col'>
				<span className='text-sm font-semibold text-foreground'>
					{t('orders.ordering_closed')}
				</span>
				<span className='text-xs text-muted-foreground'>
					{t('orders.ordering_closed_body')}
				</span>
			</div>
		</div>
	)
}
