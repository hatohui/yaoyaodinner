import type { ComponentProps } from 'react'
import { MapPin, Users } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { cn } from '@/utils/shadcn'
import { tableDiameter } from './layout'

interface FloorPlanTableProps extends ComponentProps<'button'> {
	table: TableDto
	isMine?: boolean
}

export function FloorPlanTable({
	table,
	isMine = false,
	className,
	style,
	...props
}: FloorPlanTableProps) {
	return (
		<button
			type='button'
			style={{
				left: `${table.x}%`,
				top: `${table.y}%`,
				width: `${tableDiameter(table.capacity)}%`,
				...style,
			}}
			className={cn(
				'absolute flex aspect-square -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 bg-card leading-tight font-semibold shadow-sm transition-transform',
				className,
				isMine && 'border-primary ring-[0.8cqw] ring-primary/40'
			)}
			{...props}
		>
			{isMine && (
				<MapPin className='absolute -top-[1.2cqw] size-[max(2.6cqw,12px)] fill-primary text-primary-foreground' />
			)}
			<span className='text-[max(2.4cqw,10px)] text-foreground'>
				{table.name}
			</span>
			<span className='flex items-center gap-[0.4cqw] text-[max(1.8cqw,8px)] font-medium text-muted-foreground'>
				<Users className='size-[max(1.8cqw,8px)]' />
				{table.seated}/{table.capacity}
			</span>
		</button>
	)
}
