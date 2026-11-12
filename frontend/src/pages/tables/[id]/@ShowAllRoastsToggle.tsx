import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flame } from 'lucide-react'
import { useRoastVisible } from '@/hooks/useRoastVisible'
import { bump } from '@/utils/fireFx'
import { cn } from '@/utils/shadcn'

export function ShowAllRoastsToggle() {
	const { t } = useTranslation()
	const showAll = useRoastVisible(s => s.showAll)
	const toggleShowAll = useRoastVisible(s => s.toggleShowAll)
	const ref = useRef<HTMLButtonElement>(null)

	return (
		<div className='flex items-center rounded-full border border-border bg-control p-0.5'>
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
					'flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors',
					showAll
						? 'bg-fire text-fire-foreground'
						: 'text-muted-foreground hover:text-fire'
				)}
			>
				<Flame
					className={cn(
						'size-3.5 motion-safe:animate-flame',
						showAll && 'fill-fire-foreground/40'
					)}
				/>
				<span className='hidden sm:inline'>{t('roast.show_all')}</span>
			</button>
		</div>
	)
}
