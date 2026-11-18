import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Users } from 'lucide-react'
import type { PersonDto } from '@/api/model'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/utils/shadcn'

interface WishPeoplePickerProps {
	people: PersonDto[]
	value: string[]
	canEdit: boolean
	onChange: (personIds: string[]) => void
}

/** Who a planned dish is for, so adding it to the cart keeps that split. */
export function WishPeoplePicker({
	people,
	value,
	canEdit,
	onChange,
}: WishPeoplePickerProps) {
	const { t } = useTranslation()
	const [draft, setDraft] = useState<Set<string> | null>(null)

	const seated = new Set(people.map(p => p.id))
	const current = value.filter(id => seated.has(id))
	const names = people.filter(p => current.includes(p.id)).map(p => p.name)
	const label = names.length ? names.join(', ') : t('plan_board.whole_table')

	if (!canEdit) {
		return names.length ? (
			<span className='inline-flex h-5 min-w-0 items-center gap-1 truncate rounded-md border border-border/60 bg-muted/40 px-1.5 text-[11px] font-medium text-muted-foreground'>
				<Users className='size-3 shrink-0' />
				<span className='truncate'>{label}</span>
			</span>
		) : null
	}

	// edits stay local while open and save once, so quick taps never race
	const setOpen = (open: boolean) => {
		if (open) return setDraft(new Set(current))
		if (
			draft &&
			(draft.size !== current.length || current.some(id => !draft.has(id)))
		)
			onChange([...draft])
		setDraft(null)
	}

	const toggle = (id: string) =>
		setDraft(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})

	const chip = (active: boolean) =>
		cn(
			'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
			active
				? 'border-primary bg-primary text-primary-foreground'
				: 'border-border bg-control text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
		)

	return (
		<Popover open={draft !== null} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					title={t('plan_board.who_for')}
					className={cn(
						'relative inline-flex h-5 min-w-0 max-w-full cursor-pointer items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium transition-colors after:absolute after:-inset-x-1 after:-inset-y-1.5 after:content-[""] sm:after:hidden',
						names.length
							? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
							: 'border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
					)}
				>
					<Users className='size-3 shrink-0' />
					<span className='truncate'>{label}</span>
					<ChevronDown className='size-3 shrink-0 opacity-70' />
				</button>
			</PopoverTrigger>
			<PopoverContent align='start' className='flex w-72 flex-col gap-3'>
				<div className='flex flex-col gap-0.5'>
					<p className='text-sm font-semibold text-foreground'>
						{t('plan_board.who_for')}
					</p>
					<p className='text-xs text-muted-foreground'>
						{t('plan_board.who_hint')}
					</p>
				</div>
				<div className='flex flex-wrap gap-2'>
					<button
						type='button'
						onClick={() => setDraft(new Set())}
						className={chip(draft?.size === 0)}
					>
						{t('plan_board.whole_table')}
					</button>
					{people.map(person => (
						<button
							key={person.id}
							type='button'
							onClick={() => toggle(person.id)}
							className={chip(Boolean(draft?.has(person.id)))}
						>
							{person.name}
						</button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	)
}
