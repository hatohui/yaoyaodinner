import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { TotalAmount } from '@/components/ordering/TotalAmount'

interface OrderRoundSectionProps {
	title: string
	locked: boolean
	subtotal: number
	currency?: string
	partial?: boolean
	children: ReactNode
}

export function OrderRoundSection({
	title,
	locked,
	subtotal,
	currency,
	partial,
	children,
}: OrderRoundSectionProps) {
	return (
		<section className='flex flex-col gap-2'>
			<div className='flex items-center justify-between gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
				<span className='flex items-center gap-1.5'>
					{locked && <Lock className='size-3' />}
					{title}
				</span>
				<span className='tabular-nums'>
					<TotalAmount
						amount={subtotal}
						currency={currency}
						partial={partial}
					/>
				</span>
			</div>
			{children}
		</section>
	)
}
