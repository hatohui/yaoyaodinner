import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import type { PersonDto } from '@/api/model'
import type { OrderedLine } from '@/components/ordering/groupOrders'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { cn } from '@/utils/shadcn'

interface OrderDishGroupProps {
	lines: OrderedLine[]
	people: PersonDto[]
	currency: string
	compact?: boolean
	children: ReactNode
}

/** One dish and its splits, folded into a card that drops down its rows. */
export function OrderDishGroup({
	lines,
	people,
	currency,
	compact = false,
	children,
}: OrderDishGroupProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const prevCompact = useRef(compact)

	useEffect(() => {
		if (prevCompact.current !== compact) {
			prevCompact.current = compact
			setOpen(!compact)
		}
	}, [compact])
	const head = lines[0]
	const quantity = lines.reduce((sum, l) => sum + l.quantity, 0)
	const total = lines.reduce(
		(sum, l) => (l.shouldCalculate ? sum + l.price * l.quantity : sum),
		0
	)
	const name = `${head.foodName}${head.variantLabel ? ` - ${head.variantLabel}` : ''}`

	const splitLabel = (line: OrderedLine) => {
		if (line.splitAll) return t('orders.shared')
		const names = line.splits.map(
			s =>
				people.find(p => p.id === s.personId)?.name ??
				t('orders.unknown_person')
		)
		return names.join(', ') || t('orders.personal')
	}

	return (
		<li className='overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md'>
			<button
				type='button'
				aria-expanded={open}
				onClick={() => setOpen(o => !o)}
				className='group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-muted/35 focus-visible:bg-brand-muted/35 focus-visible:outline-none sm:px-4 sm:py-3'
			>
				<OrderThumb imageKey={head.foodImageUrl} alt={head.foodName} />
				<span className='flex min-w-0 flex-1 flex-col gap-1'>
					<span title={name} className='truncate font-medium text-foreground'>
						{name}
					</span>
					<span className='flex flex-wrap gap-1'>
						{lines.map(line => (
							<span
								key={line.key}
								className='max-w-full truncate rounded-full bg-brand-muted px-2 py-0.5 text-[11px] font-semibold text-primary'
							>
								{splitLabel(line)} ×{line.quantity}
							</span>
						))}
					</span>
				</span>
				<span className='flex shrink-0 flex-col items-end gap-0.5'>
					<span className='text-sm font-semibold tabular-nums text-foreground'>
						×{quantity}
					</span>
					{head.shouldCalculate ? (
						<span className='text-xs tabular-nums text-muted-foreground'>
							{total.toFixed(2)} {currency}
						</span>
					) : (
						<span className='rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground'>
							{t('orders.free')}
						</span>
					)}
				</span>
				<ChevronDown
					className={cn(
						'size-4 shrink-0 text-muted-foreground transition-all group-hover:text-primary',
						open && 'rotate-180'
					)}
				/>
			</button>
			{open && (
				<ul className='m-0 flex list-none flex-col divide-y divide-border/60 border-t border-border/60 p-0'>
					{children}
				</ul>
			)}
		</li>
	)
}
