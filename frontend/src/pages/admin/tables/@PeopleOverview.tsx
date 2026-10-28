import { useTranslation } from 'react-i18next'
import { useGetTables } from '@/api/tables/tables'
import type { TableListDto } from '@/api/model'
import { CardGridSkeleton } from '@/components/common/ListSkeletons'
import { TablePeopleCard } from '@/components/common/TablePeopleCard'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useDebounce } from '@/hooks/useDebounce'
import { TABLE_FETCH_ALL_COUNT } from '@/common/constants'

export function PeopleOverview({ search }: { search: string }) {
	const { t } = useTranslation()
	const debouncedSearch = useDebounce(search, 300)
	const { scopedEventId } = useAdminEvents()
	const { data, isLoading } = useGetTables<TableListDto>({
		count: TABLE_FETCH_ALL_COUNT,
		search: debouncedSearch || undefined,
		eventId: scopedEventId,
	})
	const tables = data?.tables ?? []

	if (isLoading) {
		return (
			<CardGridSkeleton
				count={8}
				lines={2}
				className='lg:grid-cols-3 2xl:grid-cols-4'
			/>
		)
	}

	if (tables.length === 0) {
		return (
			<p className='py-16 text-center text-sm text-muted-foreground'>
				{t('tables.none_found')}
			</p>
		)
	}

	return (
		<ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
			{tables.map(table => (
				<li key={table.id}>
					<TablePeopleCard table={table} />
				</li>
			))}
		</ul>
	)
}
