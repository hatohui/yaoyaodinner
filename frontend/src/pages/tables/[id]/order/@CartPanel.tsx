import { useTranslation } from 'react-i18next'
import type { PersonDto } from '@/api/model'
import type { SplitMode } from '@/components/common/SplitModeSelector'
import { Button } from '@/components/ui/button'
import { CartLine } from './@CartLine'
import type { CartLine as CartLineData } from './@useOrderCart'

interface CartPanelProps {
	lines: CartLineData[]
	people: PersonDto[]
	myPersonId: string | null
	total: number
	currency: string
	isPlacing: boolean
	onQuantityChange: (foodId: string, quantity: number) => void
	onModeChange: (foodId: string, mode: SplitMode) => void
	onVariantChange: (foodId: string, variantId: string, price: number) => void
	onTogglePerson: (foodId: string, personId: string) => void
	onRemove: (foodId: string) => void
	onClear: () => void
	onCheckout: () => void
}

export function CartPanel({
	lines,
	people,
	myPersonId,
	total,
	currency,
	isPlacing,
	onQuantityChange,
	onModeChange,
	onVariantChange,
	onTogglePerson,
	onRemove,
	onClear,
	onCheckout,
}: CartPanelProps) {
	const { t } = useTranslation()

	const hasInvalidSplit = lines.some(
		l => l.mode === 'choose' && l.chosen.size === 0
	)

	return (
		<div className='flex h-full flex-col gap-3'>
			{lines.length > 0 && (
				<button
					type='button'
					onClick={onClear}
					className='self-end text-xs text-muted-foreground transition-colors hover:text-destructive'
				>
					{t('orders.clear_cart')}
				</button>
			)}

			{lines.length === 0 ? (
				<p className='rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground'>
					{t('orders.cart_empty')}
				</p>
			) : (
				<ul className='flex flex-col gap-2'>
					{lines.map(line => (
						<CartLine
							key={line.foodId}
							line={line}
							people={people}
							myPersonId={myPersonId}
							onQuantityChange={q => onQuantityChange(line.foodId, q)}
							onModeChange={m => onModeChange(line.foodId, m)}
							onVariantChange={(v, p) => onVariantChange(line.foodId, v, p)}
							onTogglePerson={id => onTogglePerson(line.foodId, id)}
							onRemove={() => onRemove(line.foodId)}
						/>
					))}
				</ul>
			)}

			{lines.length > 0 && (
				<div className='mt-auto flex flex-col gap-3 border-t border-border pt-3'>
					<div className='flex items-center justify-between text-sm font-semibold text-foreground'>
						<span>{t('orders.total')}</span>
						<span>
							{total.toFixed(2)} {currency}
						</span>
					</div>
					<Button
						className='w-full rounded-full'
						disabled={isPlacing || hasInvalidSplit}
						onClick={onCheckout}
					>
						{isPlacing ? t('orders.placing') : t('orders.place_order')}
					</Button>
				</div>
			)}
		</div>
	)
}
