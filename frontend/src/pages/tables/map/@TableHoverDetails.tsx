import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowRight, Crown, MapPin, Users } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCanHover } from '@/hooks/useCanHover'

interface TableHoverDetailsProps {
	table: TableDto
	isMine: boolean
	children: ReactNode
}

function TableDetails({
	table,
	isMine,
}: Omit<TableHoverDetailsProps, 'children'>) {
	const { t } = useTranslation()
	const full = table.seated >= table.capacity

	return (
		<>
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
		</>
	)
}

export function TableHoverDetails({
	table,
	isMine,
	children,
}: TableHoverDetailsProps) {
	const { t } = useTranslation()
	const canHover = useCanHover()

	if (canHover) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent
					side='top'
					sideOffset={6}
					className='flex flex-col gap-1'
				>
					<TableDetails table={table} isMine={isMine} />
				</TooltipContent>
			</Tooltip>
		)
	}

	return (
		<Popover>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent
				side='top'
				sideOffset={6}
				className='flex w-auto max-w-64 flex-col gap-1 rounded-2xl p-3 text-sm'
			>
				<TableDetails table={table} isMine={isMine} />
				<Button asChild size='sm' className='mt-1.5 gap-1.5 rounded-full'>
					<Link to={`/tables/${table.id}`}>
						{t('floor_plan.open_table')}
						<ArrowRight className='size-3.5' />
					</Link>
				</Button>
			</PopoverContent>
		</Popover>
	)
}
