import { useTranslation } from 'react-i18next'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TABLE_SORTS, type TableSort } from './@useTableSearch'

interface TableSortSelectProps {
	value: TableSort
	onChange: (sort: TableSort) => void
}

export function TableSortSelect({ value, onChange }: TableSortSelectProps) {
	const { t } = useTranslation()

	// not modal, so opening it doesn't lock the page and hide the scrollbar
	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					aria-label={t('tables.sort.label')}
					className='flex h-8 items-center gap-1.5 rounded-full border border-border bg-control px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10'
				>
					<ArrowUpDown className='size-3.5 text-primary' />
					{t(`tables.sort.${value}`)}
					<ChevronDown className='size-3.5 text-muted-foreground' />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={v => onChange(v as TableSort)}
				>
					{TABLE_SORTS.map(sort => (
						<DropdownMenuRadioItem key={sort} value={sort}>
							{t(`tables.sort.${sort}`)}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
