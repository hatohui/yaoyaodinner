import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Crown, MapPin, Users } from 'lucide-react'
import type { TableDto } from '@/api/model'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface TableHoverDetailsProps {
	table: TableDto
	isMine: boolean
	children: ReactNode
}

export function TableHoverDetails({
	table,
	isMine,
	children,
}: TableHoverDetailsProps) {
	const { t } = useTranslation()
	const full = table.seated >= table.capacity

	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side='top' sideOffset={6} className='flex flex-col gap-1'>
				<span className='font-semibold'>{table.name}</span>
				<span className='flex items-center gap-1.5'>
					<Crown className='size-3.5' />
					{table.tableLeaderName ?? t('tables.no_host')}
				</span>
				<span className='flex items-center gap-1.5'>
					<Users className='size-3.5' />
					{t('tables.seats_taken', {
						seated: table.seated,
						capacity: table.capacity,
					})}
					{full && ` · ${t('tables.full')}`}
				</span>
				{isMine && (
					<span className='flex items-center gap-1.5 font-semibold'>
						<MapPin className='size-3.5' />
						{t('tables.your_table')}
					</span>
				)}
			</TooltipContent>
		</Tooltip>
	)
}
