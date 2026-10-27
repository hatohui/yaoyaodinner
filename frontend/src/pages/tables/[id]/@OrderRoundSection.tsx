import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'

interface OrderRoundSectionProps {
	title: string
	locked: boolean
	subtotal: number
	currency?: string
	children: ReactNode
}

export function OrderRoundSection({
	title,
	locked,
	subtotal,
	currency,
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
					{subtotal.toFixed(2)} {currency}
				</span>
			</div>
			{children}
		</section>
	)
}
