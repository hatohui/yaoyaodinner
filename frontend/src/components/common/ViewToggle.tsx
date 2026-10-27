import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, Rows3, Users } from 'lucide-react'
import { localStorage } from '@/utils/localstorage'
import { cn } from '@/utils/shadcn'

export type ListView = 'card' | 'compact' | 'people'

const DEFAULT_VIEWS: ListView[] = ['card', 'compact']

/** View preference, remembered per list under its own storage key. */
export function useListView(storageKey: string, views = DEFAULT_VIEWS) {
	const [view, setViewState] = useState<ListView>(() => {
		const stored = localStorage.load(storageKey) as ListView | null
		return stored && views.includes(stored) ? stored : 'card'
	})
	const setView = (next: ListView) => {
		localStorage.save(storageKey, next)
		setViewState(next)
	}
	return { view, setView }
}

interface ViewToggleProps {
	view: ListView
	onChange: (view: ListView) => void
	views?: ListView[]
}

export function ViewToggle({
	view,
	onChange,
	views = DEFAULT_VIEWS,
}: ViewToggleProps) {
	const { t } = useTranslation()
	const options = [
		{ value: 'card', icon: LayoutGrid, label: t('tables.view_card') },
		{ value: 'compact', icon: Rows3, label: t('tables.view_compact') },
		{ value: 'people', icon: Users, label: t('tables.view_people') },
	] as const

	return (
		<div className='flex items-center gap-1 rounded-full border border-border bg-control p-0.5'>
			{options
				.filter(o => views.includes(o.value))
				.map(({ value, icon: Icon, label }) => (
					<button
						key={value}
						type='button'
						onClick={() => onChange(value)}
						aria-label={label}
						title={label}
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
