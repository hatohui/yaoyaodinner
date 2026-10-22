import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserRound } from 'lucide-react'
import { useGetTables } from '@/api/tables/tables'
import type { TableListDto } from '@/api/model'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'
import { TABLE_FETCH_ALL_COUNT } from '@/common/constants'

const MAX_SUGGESTIONS = 6

interface FeedbackNameFieldProps {
	value: string
	onChange: (value: string) => void
}

export function FeedbackNameField({ value, onChange }: FeedbackNameFieldProps) {
	const { t } = useTranslation()
	const [focused, setFocused] = useState(false)
	const query = useDebounce(value.trim(), 250)

	// the table search already matches people's names, and guests can read it
	const { data } = useGetTables<TableListDto>(
		{ count: TABLE_FETCH_ALL_COUNT, search: query },
		{ query: { enabled: focused && query.length > 0 } }
	)

	const suggestions = useMemo(() => {
		const seen = new Set<string>()
		return (data?.tables ?? [])
			.flatMap(tb =>
				(tb.matchedPeople ?? []).map(name => ({ name, table: tb.name }))
			)
			.filter(({ name }) => {
				const key = name.toLowerCase()
				if (key === value.trim().toLowerCase() || seen.has(key)) return false
				seen.add(key)
				return true
			})
			.slice(0, MAX_SUGGESTIONS)
	}, [data?.tables, value])

	return (
		<div className='relative'>
			<Input
				value={value}
				onChange={e => onChange(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				placeholder={t('feedback.name_placeholder')}
				autoComplete='off'
				className='rounded-full'
			/>
			{focused && query.length > 0 && suggestions.length > 0 && (
				<ul className='absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-lg'>
					{suggestions.map(s => (
						<li key={s.name}>
							<button
								type='button'
								onMouseDown={e => e.preventDefault()}
								onClick={() => {
									onChange(s.name)
									setFocused(false)
								}}
								className='flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent'
							>
								<UserRound className='size-4 shrink-0 text-primary' />
								<span className='truncate font-medium text-popover-foreground'>
									{s.name}
								</span>
								<span className='ml-auto shrink-0 truncate text-xs text-muted-foreground'>
									{s.table}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
