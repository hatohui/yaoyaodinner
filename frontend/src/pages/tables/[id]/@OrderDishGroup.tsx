import { useState, type ReactNode } from 'react'
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
	children: ReactNode
}

// wide screens have room to show every split; phones start folded
const startsOpen = () =>
	typeof window !== 'undefined' &&
	window.matchMedia('(min-width: 640px)').matches

/** One dish ordered under several splits, folded into a card that drops down its rows. */
export function OrderDishGroup({
	lines,
	people,
	currency,
	children,
}: OrderDishGroupProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(startsOpen)
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
		<li className='overflow-hidden rounded-2xl border border-border bg-card shadow-sm'>
			<button
				type='button'
				aria-expanded={open}
				onClick={() => setOpen(o => !o)}
				className='flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-4 sm:py-3'
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
					<span
						className={cn(
							'text-xs tabular-nums',
							head.shouldCalculate ? 'text-foreground' : 'text-muted-foreground'
						)}
					>
						{head.shouldCalculate
							? `${total.toFixed(2)} ${currency}`
							: t('orders.free')}
					</span>
				</span>
				<ChevronDown
					className={cn(
						'size-4 shrink-0 text-muted-foreground transition-transform',
						open && 'rotate-180'
					)}
				/>
			</button>
			{open && (
				<ul className='m-0 flex list-none flex-col gap-1.5 border-t border-border/60 bg-muted/20 p-2'>
					{children}
				</ul>
			)}
		</li>
	)
}
