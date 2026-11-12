import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'
import { useRoastVisible } from '@/hooks/useRoastVisible'
import { bump } from '@/utils/fireFx'
import { cn } from '@/utils/shadcn'

export function ShowAllRoastsToggle() {
	const { t } = useTranslation()
	const showAll = useRoastVisible(s => s.showAll)
	const toggleShowAll = useRoastVisible(s => s.toggleShowAll)
	const ref = useRef<HTMLButtonElement>(null)

	return (
		<div
			className={cn(
				'flex items-center rounded-full border bg-control p-0.5 transition-colors',
				showAll
					? 'border-fire bg-fire/10'
					: 'border-fire/40 hover:border-fire/70'
			)}
		>
			<button
				ref={ref}
				type='button'
				onClick={() => {
					bump(ref.current, 1.4)
					toggleShowAll()
				}}
				aria-pressed={showAll}
				aria-label={t('roast.show_all')}
				title={t('roast.show_all')}
				className={cn(
					'flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors',
					showAll
						? 'bg-fire text-fire-foreground shadow-xs shadow-fire/30'
						: 'text-fire/80 hover:text-fire'
				)}
			>
				<Eye className='size-3.5' />
				<span className='hidden sm:inline'>{t('roast.show_all')}</span>
			</button>
		</div>
	)
}
