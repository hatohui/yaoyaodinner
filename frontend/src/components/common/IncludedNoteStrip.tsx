import { useTranslation } from 'react-i18next'
import { Gift } from 'lucide-react'

export function IncludedNoteStrip({ note }: { note: string }) {
	const { t } = useTranslation()

	return (
		<div className='flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5'>
			<Gift className='size-4 shrink-0 text-primary' />
			<span className='shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground'>
				{t('orders.free_limited')}
			</span>
			<span className='text-sm text-foreground'>
				{t('orders.included', { item: note })}
			</span>
		</div>
	)
}
