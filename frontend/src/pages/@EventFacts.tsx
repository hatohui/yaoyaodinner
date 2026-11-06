import { useTranslation } from 'react-i18next'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import { formatEventTime } from '@/utils/eventTime'

/** Dinner time, order deadline and place; unset times are left out. */
export function EventFacts() {
	const { t, i18n } = useTranslation()
	const { dinnerTime, deadline, timezone } = useOrderingStage()

	const format = (iso: string | null) =>
		iso ? formatEventTime(iso, timezone, i18n.language) : ''

	const facts = [
		{ label: t('dinner.label'), value: format(dinnerTime) },
		{ label: t('landing.order_by'), value: format(deadline) },
		{ label: t('landing.where'), value: t('menu.restaurant_location') },
	].filter(fact => fact.value)

	return (
		<dl className='flex flex-wrap gap-x-8 gap-y-3'>
			{facts.map(fact => (
				<div key={fact.label} className='flex flex-col'>
					<dt className='text-xs font-medium text-white/70'>{fact.label}</dt>
					<dd className='m-0 text-sm font-bold tabular-nums text-white sm:text-base'>
						{fact.value}
					</dd>
				</div>
			))}
		</dl>
	)
}
