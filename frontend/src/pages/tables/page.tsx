import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Map } from 'lucide-react'
import { SearchBar } from '@/components/common/SearchBar'
import { PaginationBar } from '@/components/common/PaginationBar'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { TableList } from './@TableList'
import { TableListSkeleton } from './@TableListSkeleton'
import { useTableSearch } from './@useTableSearch'
import { useConfig } from '@/hooks/useConfig'
import { ViewToggle, useListView } from '@/components/common/ViewToggle'
import { TABLE_LIST_VIEW_STORAGE_KEY } from '@/common/constants'

export default function TablesPage() {
	const { t } = useTranslation()
	const {
		search,
		setSearch,
		filter,
		setFilter,
		tables,
		pagedTables,
		isLoading,
		isError,
		pagination,
	} = useTableSearch()
	const { floorPlan } = useConfig()
	const { view, setView } = useListView(TABLE_LIST_VIEW_STORAGE_KEY)

	return (
		<div className='mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('tables.find_title')}
				</h1>
				{floorPlan && (
					<Link
						to='/tables/map'
						className='inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
					>
						<Map className='size-4' />
						{t('floor_plan.view_map')}
					</Link>
				)}
			</div>

			<div className='flex flex-wrap items-center gap-2'>
				<SearchBar
					value={search}
					onChange={setSearch}
					placeholder={t('tables.search_placeholder')}
					className='flex-1'
				/>
				<Select
					value={filter}
					onValueChange={v => setFilter(v as typeof filter)}
				>
					<SelectTrigger className='rounded-full'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>{t('tables.filter_all')}</SelectItem>
						<SelectItem value='free'>{t('tables.filter_free')}</SelectItem>
						<SelectItem value='full'>{t('tables.filter_full')}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className='flex items-center justify-between'>
				<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
					{t('tables.all_tables')}
				</p>
				<ViewToggle view={view} onChange={setView} />
			</div>

			{isLoading ? (
				<TableListSkeleton compact={view === 'compact'} />
			) : isError ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('tables.load_error')}
				</p>
			) : tables.length === 0 ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('tables.none_found')}
				</p>
			) : view === 'compact' ? (
				<TableList tables={tables} compact />
			) : (
				<>
					<TableList tables={pagedTables} />
					<div className='mt-4 flex justify-center'>
						<PaginationBar pagination={pagination} showPageSize />
					</div>
				</>
			)}
		</div>
	)
}
