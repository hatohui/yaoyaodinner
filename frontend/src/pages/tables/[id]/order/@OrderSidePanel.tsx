import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ReceiptText, ShoppingCart } from 'lucide-react'
import { cn } from '@/utils/shadcn'

export type SidePanelTab = 'cart' | 'ordered'

interface OrderSidePanelProps {
	tab: SidePanelTab
	onTabChange: (tab: SidePanelTab) => void
	cartCount: number
	orderedCount: number
	cart: ReactNode
	ordered: ReactNode
}

export function OrderSidePanel({
	tab,
	onTabChange,
	cartCount,
	orderedCount,
	cart,
	ordered,
}: OrderSidePanelProps) {
	const { t } = useTranslation()
	const tabs = [
		{
			value: 'cart',
			icon: ShoppingCart,
			label: t('orders.cart'),
			count: cartCount,
		},
		{
			value: 'ordered',
			icon: ReceiptText,
			label: t('orders.ordered'),
			count: orderedCount,
		},
	] as const

	return (
		<div className='flex flex-col gap-4'>
			<div
				role='tablist'
				className='grid grid-cols-2 gap-1 rounded-full border border-border bg-control p-1'
			>
				{tabs.map(({ value, icon: Icon, label, count }) => (
					<button
						key={value}
						type='button'
						role='tab'
						aria-selected={tab === value}
						onClick={() => onTabChange(value)}
						className={cn(
							'flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
							tab === value
								? 'bg-primary text-primary-foreground'
								: 'text-foreground/70 hover:text-foreground'
						)}
					>
						<Icon className='size-4' />
						{label}
						{count > 0 && (
							<span
								className={cn(
									'rounded-full px-1.5 text-xs font-semibold tabular-nums',
									tab === value
										? 'bg-primary-foreground/20'
										: 'bg-primary/15 text-primary'
								)}
							>
								{count}
							</span>
						)}
					</button>
				))}
			</div>
			{tab === 'cart' ? cart : ordered}
		</div>
	)
}
