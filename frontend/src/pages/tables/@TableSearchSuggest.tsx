import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Search, User, Users, X } from 'lucide-react'
import { useGetTables } from '@/api/tables/tables'
import type { TableDto, TableListDto } from '@/api/model'
import { Input } from '@/components/ui/input'
import { StoredImage } from '@/components/common/StoredImage'
import { useDebounce } from '@/hooks/useDebounce'
import { useIdentityTour } from '@/hooks/useIdentityTour'
import { cn } from '@/utils/shadcn'
import { defaultBannerSrc } from './@tableCardUtils'

const SUGGESTION_LIMIT = 8

type SuggestionItem =
	| { type: 'table'; key: string; table: TableDto }
	| { type: 'person'; key: string; personName: string; table: TableDto }

interface TableSearchSuggestProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
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

export function TableSearchSuggest({
	value,
	onChange,
	placeholder,
}: TableSearchSuggestProps) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const setTourQuery = useIdentityTour(s => s.setQuery)
	const listId = useId()
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(-1)
	const query = useDebounce(value.trim(), 200)

	const { data } = useGetTables<TableListDto>(
		{ count: SUGGESTION_LIMIT, search: query },
		{
			query: {
				enabled: open && query.length > 0,
				placeholderData: keepPreviousData,
				meta: { silent: true },
			},
		}
	)

	const suggestions = useMemo<SuggestionItem[]>(() => {
		const tables = data?.tables ?? []
		const needle = query.toLowerCase()
		if (!needle) return []

		const items: SuggestionItem[] = []
		for (const table of tables) {
			const tableMatches =
				String(table.no).includes(needle) ||
				table.name.toLowerCase().includes(needle)
			const matchedPeople = table.matchedPeople ?? []

			if (tableMatches || matchedPeople.length === 0) {
				items.push({
					type: 'table',
					key: `table-${table.id}`,
					table,
				})
			}

			for (const personName of matchedPeople) {
				items.push({
					type: 'person',
					key: `person-${table.id}-${personName}`,
					personName,
					table,
				})
			}
		}
		return items.slice(0, SUGGESTION_LIMIT)
	}, [data?.tables, query])

	const shown = open && query.length > 0 && suggestions.length > 0

	const pick = (item: SuggestionItem) => {
		setOpen(false)
		setActive(-1)
		setTourQuery(item.type === 'person' ? item.personName : query)
		navigate(`/tables/${item.table.id}`)
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
			<Search className='pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors' />
			<Input
				role='combobox'
				aria-expanded={shown}
				aria-controls={listId}
				aria-autocomplete='list'
				aria-activedescendant={
					shown && active >= 0 ? `${listId}-${active}` : undefined
				}
				placeholder={placeholder ?? t('tables.search_placeholder')}
				value={value}
				onChange={e => {
					onChange(e.target.value)
					setOpen(true)
					setActive(-1)
				}}
				onFocus={() => setOpen(true)}
				onBlur={() => setOpen(false)}
				onKeyDown={handleKeyDown}
				className='h-10 rounded-full border border-border bg-card pl-9.5 pr-8 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground hover:border-primary/40 focus:bg-card focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-border dark:bg-card dark:placeholder:text-muted-foreground dark:focus:bg-card'
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
					{suggestions.map((item, i) => (
						<li
							key={item.key}
							id={`${listId}-${i}`}
							role='option'
							aria-selected={i === active}
							onMouseDown={e => e.preventDefault()}
							onClick={() => pick(item)}
							onMouseEnter={() => setActive(i)}
							className={cn(
								'flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm',
								i === active && 'bg-accent text-accent-foreground'
							)}
						>
							{item.type === 'person' ? (
								<>
									<span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-primary ring-1 ring-inset ring-primary/25'>
										<User className='size-4' />
									</span>
									<span className='min-w-0 flex-1 truncate'>
										<Highlight text={item.personName} query={query} />
									</span>
									<span className='shrink-0 truncate rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'>
										{item.table.no}. {item.table.name}
									</span>
								</>
							) : (
								<>
									<span className='flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground'>
										<StoredImage
											imageKey={item.table.bannerUrl}
											alt=''
											className='size-full object-cover'
											fallback={
												<img
													src={defaultBannerSrc(item.table.no)}
													alt=''
													className='size-full object-cover'
												/>
											}
										/>
									</span>
									<span className='flex min-w-0 flex-1 items-center gap-1.5'>
										<span className='shrink-0 font-semibold tabular-nums text-muted-foreground'>
											<Highlight text={`${item.table.no}.`} query={query} />
										</span>
										<span className='truncate'>
											<Highlight text={item.table.name} query={query} />
										</span>
									</span>
									<span className='flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground'>
										<Users className='size-3.5' />
										{item.table.seated}
									</span>
								</>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
