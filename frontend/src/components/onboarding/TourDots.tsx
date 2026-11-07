import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/shadcn'

export const TOUR_STEPS = 3

export function TourDots({ current }: { current: number }) {
	const { t } = useTranslation()

	return (
		<div
			role='img'
			aria-label={t('onboarding.step_of', {
				current,
				total: TOUR_STEPS,
			})}
			className='flex items-center gap-1'
		>
			{Array.from({ length: TOUR_STEPS }, (_, i) => (
				<span
					key={i}
					className={cn(
						'h-1.5 rounded-full transition-all',
						i + 1 === current ? 'w-4 bg-primary' : 'w-1.5 bg-border',
						i + 1 < current && 'bg-primary/50'
					)}
				/>
			))}
		</div>
	)
}
