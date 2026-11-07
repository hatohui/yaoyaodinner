import { useTranslation } from 'react-i18next'
import { CircleHelp } from 'lucide-react'
import { useGuest } from '@/hooks/useGuest'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useIdentityTour } from '@/hooks/useIdentityTour'

export function IdentityTourButton() {
	const { t } = useTranslation()
	const me = useGuest(s => s.me)
	const { isAdmin } = useIsAdmin()
	const start = useIdentityTour(s => s.start)

	if (me || isAdmin) return null

	return (
		<button
			type='button'
			onClick={start}
			aria-label={t('onboarding.help')}
			className='inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-control p-2 text-sm font-medium text-foreground/80 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:px-3 sm:py-1.5'
		>
			<CircleHelp className='size-4' />
			<span className='hidden sm:inline'>{t('onboarding.help')}</span>
		</button>
	)
}
