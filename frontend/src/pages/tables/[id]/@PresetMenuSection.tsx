import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, UtensilsCrossed } from 'lucide-react'
import type { PresetMenuDto } from '@/api/model'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import { billingCurrency } from '@/utils/money'
import { cn } from '@/utils/shadcn'

interface PresetMenuSectionProps {
	preset: PresetMenuDto
}

export function PresetMenuSection({ preset }: PresetMenuSectionProps) {
	const { t } = useTranslation()
	const [collapsed, setCollapsed] = useState(
		() =>
			typeof window !== 'undefined' &&
			window.matchMedia('(max-width: 639px)').matches
	)
	const hasItems = preset.items.length > 0

	return (
		<section className='overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-sm'>
			<button
				type='button'
				onClick={() => hasItems && setCollapsed(c => !c)}
				aria-expanded={hasItems ? !collapsed : undefined}
				className={cn(
					'flex w-full items-center justify-between gap-3 bg-primary/10 px-3 py-2.5 text-left transition-colors sm:px-4',
					hasItems && 'cursor-pointer hover:bg-primary/15',
					hasItems && !collapsed && 'border-b border-border/60'
				)}
			>
				<div className='flex min-w-0 items-center gap-2.5'>
					<UtensilsCrossed className='size-4 shrink-0 text-primary' />
					<div className='flex min-w-0 flex-col'>
						<span className='whitespace-nowrap text-sm font-semibold text-foreground'>
							{t('orders.set_menu')}
						</span>
						<span className='truncate text-xs text-muted-foreground'>
							{t('orders.set_menu_shared')}
						</span>
					</div>
				</div>
				<div className='flex shrink-0 items-center gap-2'>
					{preset.price > 0 ? (
						<span className='text-sm font-semibold tabular-nums text-foreground'>
							<TotalAmount
								amount={preset.price}
								currency={billingCurrency(preset.items)}
							/>
						</span>
					) : (
						<span className='rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground'>
							{t('orders.set_menu_included')}
						</span>
					)}
					{hasItems && (
						<ChevronDown
							className={cn(
								'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
								collapsed ? '-rotate-90' : 'rotate-0'
							)}
						/>
					)}
				</div>
			</button>

			{hasItems && !collapsed && (
				<ul className='flex flex-col divide-y divide-border/60'>
					{preset.items.map(item => (
						<li
							key={item.variantId}
							className='flex items-center gap-3 px-3 py-2 sm:px-4'
						>
							<OrderThumb
								imageKey={item.imageUrl}
								alt={item.foodName}
								className='size-10 rounded-lg'
							/>
							<span className='min-w-0 flex-1 truncate text-sm text-foreground'>
								{item.foodName}
								{item.variantLabel && (
									<span className='text-muted-foreground'>
										{' - '}
										{item.variantLabel}
									</span>
								)}
							</span>
							<span className='shrink-0 text-sm font-semibold tabular-nums text-muted-foreground'>
								×{item.quantity}
							</span>
						</li>
					))}
				</ul>
			)}
		</section>
	)
}
