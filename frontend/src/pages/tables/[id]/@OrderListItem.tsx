import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, Trash2, Users2 } from 'lucide-react'
import type { OrderResponseDto, PersonDto } from '@/api/model'
import { Badge } from '@/components/ui/badge'
import { OrderThumb } from './@OrderThumb'
import { cn } from '@/utils/shadcn'

const MIN_QUANTITY = 1
const MAX_QUANTITY = 99
const QUANTITY_DEBOUNCE_MS = 400

const clampQuantity = (value: number) =>
	Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, value))

interface OrderListItemProps {
	order: OrderResponseDto
	people: PersonDto[]
	onEditSplit: () => void
	onRemove: () => void
	onQuantityChange: (quantity: number) => void
}

export function OrderListItem({
	order,
	people,
	onEditSplit,
	onRemove,
	onQuantityChange,
}: OrderListItemProps) {
	const { t } = useTranslation()
	const [quantityInput, setQuantityInput] = useState(String(order.quantity))
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
	const isEditingRef = useRef(false)

	useEffect(() => {
		if (!isEditingRef.current) setQuantityInput(String(order.quantity))
	}, [order.quantity])

	useEffect(() => () => clearTimeout(debounceRef.current), [])

	const commitQuantity = (quantity: number) => {
		clearTimeout(debounceRef.current)
		onQuantityChange(quantity)
	}

	const stepQuantity = (delta: number) => {
		const next = clampQuantity(Number(quantityInput) + delta)
		setQuantityInput(String(next))
		clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(
			() => onQuantityChange(next),
			QUANTITY_DEBOUNCE_MS
		)
	}

	const handleQuantityBlur = () => {
		isEditingRef.current = false
		const parsed = Number.parseInt(quantityInput, 10)
		const next = clampQuantity(Number.isNaN(parsed) ? order.quantity : parsed)
		setQuantityInput(String(next))
		commitQuantity(next)
	}

	const splitNames = order.splits.map(
		s => people.find(p => p.id === s.personId)?.name ?? t('orders.unknown_person')
	)
	const splitLabel = order.splitAll
		? t('orders.shared')
		: splitNames.length > 2
			? `${splitNames.slice(0, 2).join(', ')} +${splitNames.length - 2}`
			: splitNames.join(', ') || t('orders.personal')

	return (
		<li className='flex flex-col gap-2 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm'>
			<div className='flex items-start justify-between gap-2'>
				<div className='flex items-start gap-3'>
					<OrderThumb imageKey={order.foodImageUrl} alt={order.foodName} />
					<div className='flex flex-col gap-1'>
						<span
							className={cn(
								'font-medium',
								order.shouldCalculate
									? 'text-foreground'
									: 'text-foreground/50 italic'
							)}
						>
							{order.foodName}
							{order.variantLabel ? ` - ${order.variantLabel}` : ''}
						</span>
						<div className='flex items-center gap-1.5'>
							<button type='button' onClick={onEditSplit} className='w-fit'>
								<Badge variant='outline' className='gap-1 rounded-full'>
									<Users2 className='size-3' />
									{splitLabel}
								</Badge>
							</button>
							{!order.shouldCalculate && (
								<Badge className='rounded-full border-accent/30 bg-accent/15 text-[10px] text-accent'>
									{t('orders.free_badge')}
								</Badge>
							)}
						</div>
					</div>
				</div>
				<button
					type='button'
					onClick={onRemove}
					aria-label={t('orders.remove')}
					className='rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
				>
					<Trash2 className='size-4' />
				</button>
			</div>

			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => stepQuantity(-1)}
						disabled={Number(quantityInput) <= MIN_QUANTITY}
						className='flex size-7 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						<Minus className='size-3.5' />
					</button>
					<input
						type='text'
						inputMode='numeric'
						pattern='[0-9]*'
						value={quantityInput}
						onFocus={() => {
							isEditingRef.current = true
						}}
						onChange={e => {
							if (/^\d*$/.test(e.target.value)) setQuantityInput(e.target.value)
						}}
						onBlur={handleQuantityBlur}
						onKeyDown={e => {
							if (e.key === 'Enter') e.currentTarget.blur()
						}}
						aria-label={t('orders.quantity')}
						className='w-9 rounded-md border border-transparent bg-transparent text-center text-sm font-medium text-foreground transition-colors hover:border-border/60 focus:border-border focus:outline-none'
					/>
					<button
						type='button'
						onClick={() => stepQuantity(1)}
						disabled={Number(quantityInput) >= MAX_QUANTITY}
						className='flex size-7 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						<Plus className='size-3.5' />
					</button>
				</div>
				<span
					className={cn(
						'text-sm font-medium',
						order.shouldCalculate ? 'text-foreground' : 'text-foreground/50'
					)}
				>
					{(order.price * (Number(quantityInput) || order.quantity)).toFixed(2)}{' '}
					{order.currency}
				</span>
			</div>
		</li>
	)
}
