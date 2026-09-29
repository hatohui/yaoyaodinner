import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { cn } from '@/utils/shadcn'
import { type Floor, floorSummary } from './layout'

interface FloorHeaderProps {
	floor: Floor
	tables: TableDto[]
	open?: boolean
	onToggle?: () => void
	className?: string
	style?: CSSProperties
}

export function FloorHeader({
	floor,
	tables,
	open = true,
	onToggle,
	className,
	style,
}: FloorHeaderProps) {
	const { t } = useTranslation()
	const Chevron = open ? ChevronDown : ChevronRight

	const content = (
		<>
			<span className='flex items-center gap-[0.8cqw] font-semibold text-foreground'>
				{onToggle && (
					<Chevron className='size-[max(2.4cqw,12px)] text-muted-foreground' />
				)}
				{t(`floor_plan.${floor.labelKey}`)}
			</span>
			<span className='text-muted-foreground'>
				{t('floor_plan.floor_summary', floorSummary(tables, floor.id))}
			</span>
		</>
	)

	const base = cn(
		'flex items-center justify-between px-[1.5cqw] text-[max(2.2cqw,11px)]',
		className
	)

	if (!onToggle)
		return (
			<div className={base} style={style}>
				{content}
			</div>
		)

	return (
		<button
			type='button'
			aria-expanded={open}
			onClick={onToggle}
			style={style}
			className={cn(base, 'rounded-[1cqw] transition-colors hover:bg-muted/60')}
		>
			{content}
		</button>
	)
}
