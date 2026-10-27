import type { TableDto } from '@/api/model'
import type { ListView } from '@/components/common/ViewToggle'
import { useGuest } from '@/hooks/useGuest'
import { cn } from '@/utils/shadcn'
import { TableCard } from './@TableCard'
import { TableCompactCard } from './@TableCompactCard'
import { TablePeopleCard } from './@TablePeopleCard'

interface TableListProps {
	tables: TableDto[]
	view: ListView
	showTotal?: boolean
}

const GRID: Record<ListView, string> = {
	card: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
	compact:
		'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
	people: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

export function TableList({ tables, view, showTotal }: TableListProps) {
	const myTableId = useGuest(s => s.me?.tableId)

	return (
		<ul className={cn('grid gap-3', GRID[view])}>
			{tables.map(table => (
				<li key={table.id}>
					{view === 'people' ? (
						<TablePeopleCard table={table} isMine={table.id === myTableId} />
					) : view === 'compact' ? (
						<TableCompactCard
							table={table}
							isMine={table.id === myTableId}
							showTotal={showTotal}
						/>
					) : (
						<TableCard
							table={table}
							isMine={table.id === myTableId}
							showTotal={showTotal}
						/>
					)}
				</li>
			))}
		</ul>
	)
}
