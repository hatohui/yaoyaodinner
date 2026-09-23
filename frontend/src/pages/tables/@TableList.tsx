import type { TableDto } from '@/api/model'
import { useGuest } from '@/hooks/useGuest'
import { cn } from '@/utils/shadcn'
import { TableCard } from './@TableCard'
import { TableCompactCard } from './@TableCompactCard'

interface TableListProps {
	tables: TableDto[]
	compact?: boolean
}

export function TableList({ tables, compact }: TableListProps) {
	const myTableId = useGuest(s => s.me?.tableId)
	const Card = compact ? TableCompactCard : TableCard

	return (
		<ul
			className={cn(
				'grid gap-3',
				compact
					? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
					: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
			)}
		>
			{tables.map(table => (
				<li key={table.id}>
					<Card table={table} isMine={table.id === myTableId} />
				</li>
			))}
		</ul>
	)
}
