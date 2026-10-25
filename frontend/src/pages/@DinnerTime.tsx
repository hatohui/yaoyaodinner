import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/hooks/useConfig'

export function DinnerTime() {
	const { t, i18n } = useTranslation()
	const { dinnerTime } = useConfig()

	const date = new Date(dinnerTime)
	if (!dinnerTime || Number.isNaN(date.getTime())) return null

	const formatted = new Intl.DateTimeFormat(i18n.language, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(date)

	return (
		<div className='mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md'>
			<CalendarClock className='size-4' />
			<span>{t('dinner.label')}</span>
			<span className='text-white/80'>{formatted}</span>
		</div>
	)
}
