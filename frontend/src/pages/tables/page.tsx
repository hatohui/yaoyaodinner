import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Map } from 'lucide-react'
import { SearchBar } from '@/components/common/SearchBar'
import { PaginationBar } from '@/components/common/PaginationBar'
import { TableList } from './@TableList'
import { TableListSkeleton } from './@TableListSkeleton'
import { useTableSearch } from './@useTableSearch'
import { TableSortSelect } from './@TableSortSelect'
import { useConfig } from '@/hooks/useConfig'
import { ViewToggle, useListView } from '@/components/common/ViewToggle'
import { TABLE_LIST_VIEW_STORAGE_KEY } from '@/common/constants'

export default function TablesPage() {
	const { t } = useTranslation()
	const {
		search,
		setSearch,
		sort,
		setSort,
		tables,
		pagedTables,
		isLoading,
		isError,
		pagination,
	} = useTableSearch()
	const { floorPlan } = useConfig()
	const { view, setView } = useListView(TABLE_LIST_VIEW_STORAGE_KEY)
	const showTotal = sort === 'most_ordered' || sort === 'least_ordered'

	return (
		<div className='mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('tables.find_title')}
				</h1>
				{floorPlan && (
					<Link
						to='/tables/map'
						className='inline-flex items-center gap-1.5 rounded-full border border-border bg-control px-3 py-1.5 text-sm font-medium text-foreground/80 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
					>
						<Map className='size-4' />
						{t('floor_plan.view_map')}
					</Link>
				)}
			</div>

			<SearchBar
				value={search}
				onChange={setSearch}
				placeholder={t('tables.search_placeholder')}
			/>

			<div className='flex items-center justify-between'>
				<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
					{t('tables.all_tables')}
				</p>
				<div className='flex items-center gap-2'>
					<TableSortSelect value={sort} onChange={setSort} />
					<ViewToggle view={view} onChange={setView} />
				</div>
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
				<TableList tables={tables} compact showTotal={showTotal} />
			) : (
				<>
					<TableList tables={pagedTables} showTotal={showTotal} />
					<div className='mt-4 flex justify-center'>
						<PaginationBar pagination={pagination} showPageSize />
					</div>
				</>
			)}
		</div>
	)
}
