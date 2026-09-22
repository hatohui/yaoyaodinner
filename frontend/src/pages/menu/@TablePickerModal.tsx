import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { useGetTables } from '@/api/tables/tables'
import { useDebounce } from '@/hooks/useDebounce'
import type { TableListDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { SearchBar } from '@/components/common/SearchBar'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/shadcn'

interface TablePickerModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSelect: (tableId: string) => void
}

export function TablePickerModal({
	open,
	onOpenChange,
	onSelect,
}: TablePickerModalProps) {
	const { t } = useTranslation()
	const [search, setSearch] = useState('')
	const debouncedSearch = useDebounce(search, 300)

	const { data, isLoading } = useGetTables<TableListDto>(
		{ count: 50, search: debouncedSearch || undefined },
		{ query: { enabled: open } }
	)
	const tables = data?.tables ?? []

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='rounded-3xl'>
				<DialogHeader>
					<DialogTitle>{t('menu.choose_table_title')}</DialogTitle>
				</DialogHeader>

				<SearchBar
					value={search}
					onChange={setSearch}
					placeholder={t('tables.search_placeholder')}
				/>

				{isLoading ? (
					<div className='flex justify-center py-8'>
						<Spinner />
					</div>
				) : tables.length === 0 ? (
					<p className='py-8 text-center text-sm text-muted-foreground'>
						{t('tables.none_found')}
					</p>
				) : (
					<ul className='scrollbar-thin flex max-h-80 flex-col gap-2 overflow-y-auto'>
						{tables.map(table => {
							const full = table.seated >= table.capacity
							// orders belong to whoever is seated, so an empty table can't take one
							const empty = table.seated === 0
							return (
								<li key={table.id}>
									<button
										type='button'
										disabled={empty}
										onClick={() => onSelect(table.id)}
										title={empty ? t('orders.needs_people_body') : undefined}
										className='flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-left shadow-sm transition-colors enabled:hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50'
									>
										<span className='flex min-w-0 flex-col'>
											<span className='truncate font-medium text-foreground'>
												{table.name}
											</span>
											{empty && (
												<span className='text-xs text-muted-foreground'>
													{t('orders.needs_people_title')}
												</span>
											)}
										</span>
										<span
											className={cn(
												'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
												full
													? 'bg-muted text-muted-foreground'
													: 'bg-brand-muted text-primary'
											)}
										>
											<Users className='size-3.5' />
											{table.seated}/{table.capacity}
										</span>
									</button>
								</li>
							)
						})}
					</ul>
				)}
			</DialogContent>
		</Dialog>
	)
}
