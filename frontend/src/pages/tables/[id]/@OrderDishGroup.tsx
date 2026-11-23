import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Plus } from 'lucide-react'
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
	onQuickAdd?: () => void
	children: ReactNode
}

/** One dish and its splits, folded into a card that drops down its rows. */
export function OrderDishGroup({
	lines,
	people,
	currency,
	compact = false,
	onSelectFood,
	onQuickAdd,
	children,
}: OrderDishGroupProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
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

	const quickAddFooter = onQuickAdd ? (
		<button
			type='button'
			onClick={onQuickAdd}
			className='flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-border/60 bg-muted/20 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'
		>
			<Plus className='size-3.5' />
			{t('orders.add_another')}
		</button>
	) : null

	if (compact) {
		return (
			<li>
				<div className='flex items-center transition-colors hover:bg-brand-muted/35'>
					<button
						type='button'
						aria-expanded={open}
						onClick={() => setOpen(o => !o)}
						className='group flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 px-3 py-2 text-left focus-visible:bg-brand-muted/35 focus-visible:outline-none sm:px-4'
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
								<span className='font-semibold text-foreground/80 tabular-nums sm:hidden'>
									×{quantity} ·{' '}
								</span>
								{summarySplits}
							</span>
						</span>
						<span className='flex shrink-0 items-baseline gap-2 tabular-nums'>
							<span className='hidden text-xs font-semibold text-muted-foreground sm:inline'>
								×{quantity}
							</span>
							<span className='text-right text-sm font-semibold text-foreground sm:w-16'>
								{priceText}
							</span>
						</span>
						<ChevronDown
							className={cn(
								'hidden size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:text-primary sm:block',
								open && 'rotate-180'
							)}
						/>
					</button>
					{onQuickAdd && (
						<button
							type='button'
							onClick={onQuickAdd}
							aria-label={t('orders.add_another')}
							title={t('orders.add_another')}
							className='mr-2.5 flex size-8 shrink-0 sm:size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:mr-3'
						>
							<Plus className='size-3.5' />
						</button>
					)}
				</div>
				{open && (
					<>
						<ul className='m-0 flex list-none flex-col divide-y divide-border/60 border-t border-border/60 bg-muted/20 p-0'>
							{children}
						</ul>
						{quickAddFooter}
					</>
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
				<>
					<ul className='m-0 flex list-none flex-col divide-y divide-border/60 border-t border-border/60 p-0'>
						{children}
					</ul>
					{quickAddFooter}
				</>
			)}
		</li>
	)
}
