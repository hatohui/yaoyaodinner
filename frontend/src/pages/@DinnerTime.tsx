import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import { formatEventTime } from '@/utils/eventTime'

export function DinnerTime() {
	const { t, i18n } = useTranslation()
	const { dinnerTime, timezone } = useOrderingStage()

	const formatted = dinnerTime
		? formatEventTime(dinnerTime, timezone, i18n.language)
		: ''
	if (!formatted) return null

	return (
		<div className='mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md'>
			<CalendarClock className='size-4' />
			<span>{t('dinner.label')}</span>
			<span className='text-white/80'>{formatted}</span>
		</div>
	)
}
