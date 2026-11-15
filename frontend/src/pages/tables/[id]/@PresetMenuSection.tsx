import { useTranslation } from 'react-i18next'
import { UtensilsCrossed } from 'lucide-react'
import type { PresetMenuDto } from '@/api/model'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import { billingCurrency } from '@/utils/money'

interface PresetMenuSectionProps {
	preset: PresetMenuDto
}

export function PresetMenuSection({ preset }: PresetMenuSectionProps) {
	const { t } = useTranslation()

	return (
		<section className='overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-sm'>
			<div className='flex items-center justify-between gap-3 border-b border-border/60 bg-primary/10 px-3 py-2.5 sm:px-4'>
				<div className='flex min-w-0 items-center gap-2'>
					<UtensilsCrossed className='size-4 shrink-0 text-primary' />
					<span className='text-sm font-semibold text-foreground'>
						{t('orders.set_menu')}
					</span>
					<span className='truncate text-xs text-muted-foreground'>
						{t('orders.set_menu_shared')}
					</span>
				</div>
				{preset.price > 0 ? (
					<span className='shrink-0 text-sm font-semibold tabular-nums text-foreground'>
						<TotalAmount
							amount={preset.price}
							currency={billingCurrency(preset.items)}
						/>
					</span>
				) : (
					<span className='shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground'>
						{t('orders.set_menu_included')}
					</span>
				)}
			</div>

			{preset.items.length > 0 && (
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
