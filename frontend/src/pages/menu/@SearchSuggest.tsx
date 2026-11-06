import { useId, useState, type KeyboardEvent } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search, UtensilsCrossed, X } from 'lucide-react'
import { useSuggestFoods } from '@/api/foods/foods'
import type { FoodSuggestionDto } from '@/api/model'
import { Input } from '@/components/ui/input'
import { StoredImage } from '@/components/common/StoredImage'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/utils/shadcn'

const SUGGESTION_LIMIT = 6

interface SearchSuggestProps {
	value: string
	onChange: (value: string) => void
	onSelect?: (suggestion: FoodSuggestionDto) => void
}

function Highlight({ text, query }: { text: string; query: string }) {
	const at = text.toLowerCase().indexOf(query.toLowerCase())
	if (!query || at < 0) return <>{text}</>
	return (
		<>
			{text.slice(0, at)}
			<span className='font-semibold text-primary'>
				{text.slice(at, at + query.length)}
			</span>
			{text.slice(at + query.length)}
		</>
	)
}

export function SearchSuggest({
	value,
	onChange,
	onSelect,
}: SearchSuggestProps) {
	const { t, i18n } = useTranslation()
	const listId = useId()
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(-1)
	const query = useDebounce(value.trim(), 200)

	const { data: suggestions = [] } = useSuggestFoods<FoodSuggestionDto[]>(
		{ q: query, lang: i18n.language, limit: SUGGESTION_LIMIT },
		{
			query: {
				enabled: open && query.length > 0,
				placeholderData: keepPreviousData,
				meta: { silent: true },
			},
		}
	)

	const shown = open && query.length > 0 && suggestions.length > 0

	const pick = (suggestion: FoodSuggestionDto) => {
		setOpen(false)
		setActive(-1)
		if (onSelect) onSelect(suggestion)
		else onChange(suggestion.name)
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			setOpen(false)
			return
		}
		if (!shown) return
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault()
			const step = e.key === 'ArrowDown' ? 1 : -1
			setActive(i => (i + step + suggestions.length) % suggestions.length)
		} else if (e.key === 'Enter' && active >= 0) {
			e.preventDefault()
			pick(suggestions[active])
		}
	}

	return (
		<div className='relative flex-1'>
			<Search className='absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/60 transition-colors' />
			<Input
				role='combobox'
				aria-expanded={shown}
				aria-controls={listId}
				aria-autocomplete='list'
				aria-activedescendant={
					shown && active >= 0 ? `${listId}-${active}` : undefined
				}
				placeholder={t('menu.search_placeholder')}
				value={value}
				onChange={e => {
					onChange(e.target.value)
					setOpen(true)
					setActive(-1)
				}}
				onFocus={() => setOpen(true)}
				onBlur={() => setOpen(false)}
				onKeyDown={handleKeyDown}
				className='h-10 rounded-full border border-border bg-card pl-9.5 pr-8 text-sm text-foreground shadow-xs transition-all placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-white/20 dark:bg-white/10 dark:placeholder:text-white/50'
			/>
			{value && (
				<button
					type='button'
					onClick={() => onChange('')}
					className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
					aria-label={t('a11y.clear_search')}
				>
					<X className='size-3.5' />
				</button>
			)}

			{shown && (
				<ul
					id={listId}
					role='listbox'
					aria-label={t('menu.suggestions')}
					className='absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-border bg-popover p-1 text-popover-foreground shadow-lg'
				>
					{suggestions.map((s, i) => (
						<li
							key={s.id}
							id={`${listId}-${i}`}
							role='option'
							aria-selected={i === active}
							// keep focus in the input so blur doesn't close the list first
							onMouseDown={e => e.preventDefault()}
							onClick={() => pick(s)}
							onMouseEnter={() => setActive(i)}
							className={cn(
								'flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm',
								i === active && 'bg-accent text-accent-foreground'
							)}
						>
							<span className='flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground'>
								<StoredImage
									imageKey={s.imageUrl}
									alt=''
									className='size-full object-cover'
									fallback={<UtensilsCrossed className='size-4' />}
								/>
							</span>
							<span className='truncate'>
								<Highlight text={s.name} query={query} />
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
