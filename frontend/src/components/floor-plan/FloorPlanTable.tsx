import {
	type ComponentProps,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { MapPin } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { cn } from '@/utils/shadcn'
import { tableDiameter } from './layout'

const NAME_MAX_WIDTH = 0.8
const TABLE_WORD = /\b(table|tbl)\b|^bàn\s+|桌$|^โต๊ะ\s*/gi

function nameCandidates(name: string) {
	const trimmed = name.trim()
	const stripped = trimmed.replace(TABLE_WORD, '').replace(/\s+/g, ' ').trim()
	const words = (stripped || trimmed).split(' ').filter(Boolean)
	const initials =
		words.length > 1
			? words
					.map(word => (/^\d+$/.test(word) ? word : word[0].toUpperCase()))
					.join('')
			: ''
	return [...new Set([trimmed, stripped, initials].filter(Boolean))]
}

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
	const measureRefs = useRef<(HTMLSpanElement | null)[]>([])
	const candidates = useMemo(() => nameCandidates(table.name), [table.name])
	const [label, setLabel] = useState<string | null>(null)

	useLayoutEffect(() => {
		const button = buttonRef.current
		if (!button) return
		measureRefs.current.length = candidates.length
		const check = () => {
			const maxWidth = button.clientWidth * NAME_MAX_WIDTH
			const index = measureRefs.current.findIndex(
				span => span && span.scrollWidth <= maxWidth
			)
			setLabel(index === -1 ? null : candidates[index])
		}
		check()
		const observer = new ResizeObserver(check)
		observer.observe(button)
		return () => observer.disconnect()
	}, [candidates])

	const setRefs = (node: HTMLButtonElement | null) => {
		buttonRef.current = node
		if (typeof ref === 'function') ref(node)
		else if (ref) ref.current = node
	}

	const isJustNumber =
		!label ||
		label.trim() === String(table.no) ||
		label.trim().toLowerCase() === `table ${table.no}`

	return (
		<button
			ref={setRefs}
			type='button'
			title={table.name}
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
			{candidates.map((candidate, index) => (
				<span
					key={candidate}
					ref={node => {
						measureRefs.current[index] = node
					}}
					aria-hidden
					className='invisible absolute text-[max(2.4cqw,10px)] whitespace-nowrap'
				>
					{candidate}
				</span>
			))}
			{isJustNumber ? (
				<span className='text-[max(3.2cqw,13px)] font-bold tabular-nums text-foreground'>
					#{table.no}
				</span>
			) : (
				<>
					<span className='text-[max(2.4cqw,10px)] font-semibold whitespace-nowrap text-foreground'>
						{label}
					</span>
					<span className='text-[max(1.8cqw,8px)] font-medium tabular-nums text-muted-foreground'>
						#{table.no}
					</span>
				</>
			)}
		</button>
	)
}
