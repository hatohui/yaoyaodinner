import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LOCATION_ADDRESS, LOCATION_MAPS_URL } from '@/common/constants'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import { cn } from '@/utils/cn'
import { formatEventTime } from '@/utils/eventTime'

interface FactItem {
	label: string
	value: string
	href?: string
}

/** Dinner time, order deadline and place; unset times are left out. */
export function EventFacts() {
	const { t, i18n } = useTranslation()
	const { dinnerTime, deadline, timezone } = useOrderingStage()

	const format = (iso: string | null) =>
		iso ? formatEventTime(iso, timezone, i18n.language) : ''

	const facts: FactItem[] = [
		{ label: t('dinner.label'), value: format(dinnerTime) },
		{ label: t('landing.order_by'), value: format(deadline) },
		{
			label: t('landing.where'),
			value: t('menu.restaurant_location'),
			href: LOCATION_MAPS_URL,
		},
	].filter(fact => fact.value)

	return (
		<dl className='flex flex-wrap gap-x-8 gap-y-3'>
			{facts.map(fact => (
				<div
					key={fact.label}
					className={cn('flex flex-col', fact.href && 'group relative')}
				>
					<dt className='text-xs font-medium text-white/70'>{fact.label}</dt>
					<dd className='m-0 text-sm font-bold tabular-nums text-white sm:text-base'>
						{fact.href ? (
							<a
								href={fact.href}
								target='_blank'
								rel='noopener noreferrer'
								className='inline-flex items-center gap-1.5 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary after:absolute after:inset-0'
								title={LOCATION_ADDRESS}
							>
								<span>{fact.value}</span>
								<ExternalLink className='size-3.5 text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:text-white' />
							</a>
						) : (
							fact.value
						)}
					</dd>
				</div>
			))}
		</dl>
	)
}
