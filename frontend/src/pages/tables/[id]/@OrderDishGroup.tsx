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
	onSelectFood?: (foodId: string) => void
	children: ReactNode
}

/** One dish and its splits, folded into a card that drops down its rows. */
export function OrderDishGroup({
	lines,
	people,
	currency,
	compact = false,
	onSelectFood,
	children,
}: OrderDishGroupProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(!compact)
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

	const summarySplits = lines
		.map(l =>
			lines.length > 1 ? `${splitLabel(l)} ×${l.quantity}` : splitLabel(l)
		)
		.join(', ')

	const priceText = head.shouldCalculate
		? total > 0
			? `${total.toFixed(2)} ${currency}`
			: t('menu.seasonal_price')
		: t('orders.free')

	const thumb = (extraClass?: string) => {
		const img = (
			<OrderThumb
				imageKey={head.foodImageUrl}
				alt={head.foodName}
				className={extraClass}
			/>
		)
		if (!onSelectFood) return img
		return (
			<span
				role='button'
				tabIndex={0}
				aria-label={head.foodName}
				onClick={e => {
					e.stopPropagation()
					onSelectFood(head.foodId)
				}}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						e.stopPropagation()
						onSelectFood(head.foodId)
					}
				}}
				className='shrink-0 cursor-pointer transition-opacity hover:opacity-85'
			>
				{img}
			</span>
		)
	}

	if (compact) {
		return (
			<li>
				<button
					type='button'
					aria-expanded={open}
					onClick={() => setOpen(o => !o)}
					className='group flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-brand-muted/35 focus-visible:bg-brand-muted/35 focus-visible:outline-none sm:px-4'
				>
					{thumb('size-8 rounded-lg')}
					<span className='flex min-w-0 flex-1 flex-col'>
						<span
							title={name}
							className='truncate text-sm font-medium text-foreground'
						>
							{name}
						</span>
						<span className='truncate text-xs text-muted-foreground'>
							{summarySplits}
						</span>
					</span>
					<span className='flex shrink-0 items-baseline gap-2 tabular-nums'>
						<span className='text-xs font-semibold text-muted-foreground'>
							×{quantity}
						</span>
						<span className='w-16 text-right text-sm font-semibold text-foreground'>
							{priceText}
						</span>
					</span>
					<ChevronDown
						className={cn(
							'size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:text-primary',
							open && 'rotate-180'
						)}
					/>
				</button>
				{open && (
					<ul className='m-0 flex list-none flex-col divide-y divide-border/60 border-t border-border/60 bg-muted/20 p-0'>
						{children}
					</ul>
				)}
			</li>
		)
	}

	return (
		<li className='overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md'>
			<button
				type='button'
				aria-expanded={open}
				onClick={() => setOpen(o => !o)}
				className='group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-muted/35 focus-visible:bg-brand-muted/35 focus-visible:outline-none sm:px-4 sm:py-3'
			>
				{thumb()}
				<span className='flex min-w-0 flex-1 flex-col gap-1'>
					<span title={name} className='truncate font-medium text-foreground'>
						{name}
					</span>
					{!open && (
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
					)}
				</span>
				<span className='flex shrink-0 flex-col items-end gap-0.5'>
					<span className='text-sm font-semibold tabular-nums text-foreground'>
						×{quantity}
					</span>
					{head.shouldCalculate ? (
						<span className='text-xs tabular-nums text-muted-foreground'>
							{total > 0
								? `${total.toFixed(2)} ${currency}`
								: t('menu.seasonal_price')}
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
