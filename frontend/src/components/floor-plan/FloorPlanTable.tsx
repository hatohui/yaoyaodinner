import { type ComponentProps, useLayoutEffect, useRef, useState } from 'react'
import { MapPin, Users } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { cn } from '@/utils/shadcn'
import { tableDiameter } from './layout'

const NAME_MAX_WIDTH = 0.8

interface FloorPlanTableProps extends ComponentProps<'button'> {
	table: TableDto
	isMine?: boolean
}

export function FloorPlanTable({
	table,
	isMine = false,
	className,
	style,
	ref,
	...props
}: FloorPlanTableProps) {
	const buttonRef = useRef<HTMLButtonElement | null>(null)
	const nameRef = useRef<HTMLSpanElement>(null)
	const [nameFits, setNameFits] = useState(false)

	useLayoutEffect(() => {
		const button = buttonRef.current
		const name = nameRef.current
		if (!button || !name) return
		const check = () =>
			setNameFits(name.scrollWidth <= button.clientWidth * NAME_MAX_WIDTH)
		check()
		const observer = new ResizeObserver(check)
		observer.observe(button)
		return () => observer.disconnect()
	}, [table.name])

	const setRefs = (node: HTMLButtonElement | null) => {
		buttonRef.current = node
		if (typeof ref === 'function') ref(node)
		else if (ref) ref.current = node
	}

	return (
		<button
			ref={setRefs}
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
			<span
				ref={nameRef}
				aria-hidden={!nameFits}
				className={cn(
					'text-[max(2.4cqw,10px)] whitespace-nowrap text-foreground',
					!nameFits && 'invisible absolute'
				)}
			>
				{table.name}
			</span>
			{!nameFits && (
				<span className='text-[max(3.2cqw,12px)] text-foreground'>
					{table.no}
				</span>
			)}
			<span className='flex items-center gap-[0.4cqw] text-[max(1.8cqw,8px)] font-medium text-muted-foreground'>
				<Users className='size-[max(1.8cqw,8px)]' />
				{table.seated}/{table.capacity}
			</span>
		</button>
	)
}
