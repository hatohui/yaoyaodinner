import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'

interface AddControlProps {
	quantity: number
	onAdd?: () => void
	onQuantityChange?: (quantity: number) => void
}

// these sit inside the card's link, so a press must not also navigate
const press = (action?: () => void) => (e: MouseEvent) => {
	e.preventDefault()
	e.stopPropagation()
	action?.()
}

/** Add button, or a stepper once the dish is in the cart. */
export function AddControl({
	quantity,
	onAdd,
	onQuantityChange,
}: AddControlProps) {
	const { t } = useTranslation()

	if (quantity === 0)
		return (
			<button
				type='button'
				aria-label={t('orders.add')}
				title={t('orders.add')}
				onClick={press(onAdd)}
				className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-110'
			>
				<Plus className='size-4' strokeWidth={3} />
			</button>
		)

	return (
		<div className='flex shrink-0 items-center gap-1 rounded-full bg-brand-muted p-0.5'>
			<button
				type='button'
				aria-label={t('orders.decrease')}
				onClick={press(() => onQuantityChange?.(quantity - 1))}
				className='flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105'
			>
				<Minus className='size-4' strokeWidth={3} />
			</button>
			<span className='min-w-4 text-center text-sm font-bold tabular-nums text-foreground'>
				{quantity}
			</span>
			<button
				type='button'
				aria-label={t('orders.increase')}
				onClick={press(() => onQuantityChange?.(quantity + 1))}
				className='flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105'
			>
				<Plus className='size-4' strokeWidth={3} />
			</button>
		</div>
	)
}
