import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, Rows3 } from 'lucide-react'
import { localStorage } from '@/utils/localstorage'
import { cn } from '@/utils/shadcn'

export type ListView = 'card' | 'compact'

/** Card/compact preference, remembered per list under its own storage key. */
export function useListView(storageKey: string) {
	const [view, setViewState] = useState<ListView>(() =>
		localStorage.load(storageKey) === 'compact' ? 'compact' : 'card'
	)
	const setView = (next: ListView) => {
		localStorage.save(storageKey, next)
		setViewState(next)
	}
	return { view, setView }
}

interface ViewToggleProps {
	view: ListView
	onChange: (view: ListView) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
	const { t } = useTranslation()
	const options = [
		{ value: 'card', icon: LayoutGrid, label: t('tables.view_card') },
		{ value: 'compact', icon: Rows3, label: t('tables.view_compact') },
	] as const

	return (
		<div className='flex items-center gap-1 rounded-full border border-border bg-control p-0.5'>
			{options.map(({ value, icon: Icon, label }) => (
				<button
					key={value}
					type='button'
					onClick={() => onChange(value)}
					aria-label={label}
					aria-pressed={view === value}
					className={cn(
						'flex size-7 items-center justify-center rounded-full transition-colors',
						view === value
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'
					)}
				>
					<Icon className='size-3.5' />
				</button>
			))}
		</div>
	)
}
