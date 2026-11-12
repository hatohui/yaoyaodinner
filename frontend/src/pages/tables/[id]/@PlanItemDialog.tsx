import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useGetFoodById } from '@/api/foods/foods'
import type { FoodDetailDto, TablePlanItemDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { StoredImage } from '@/components/common/StoredImage'
import { STALE_TIME_STATIC } from '@/common/constants'
import { cn } from '@/utils/shadcn'

const stepClass =
	'flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:opacity-40'

interface PlanItemDialogProps {
	item: TablePlanItemDto | null
	onOpenChange: (open: boolean) => void
	onSave: (item: TablePlanItemDto) => void
	onRemove: () => void
}

export function PlanItemDialog({
	item,
	onOpenChange,
	onSave,
	onRemove,
}: PlanItemDialogProps) {
	const { t, i18n } = useTranslation()
	const open = item !== null
	const { data: detail, isLoading } = useGetFoodById<FoodDetailDto>(
		item?.foodId ?? '',
		{ lang: i18n.language },
		{ query: { enabled: open, staleTime: STALE_TIME_STATIC } }
	)
	const [variantId, setVariantId] = useState('')
	const [quantity, setQuantity] = useState(1)

	useEffect(() => {
		if (!item) return
		setVariantId(item.variantId)
		setQuantity(item.quantity)
	}, [item])

	const variants = (detail?.variants ?? []).filter(v => v.isAvailable)
	const variant = variants.find(v => v.id === variantId)

	const save = () => {
		if (!item) return
		onSave({
			...item,
			variantId,
			quantity,
			label: variant && variants.length > 1 ? variant.label : item.label,
			price: variant ? variant.price : item.price,
			currency: variant?.currency ?? item.currency,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[85vh] flex-col overflow-hidden rounded-3xl p-0 sm:max-w-md'>
				{item?.imageUrl ? (
					<div className='relative h-48 w-full shrink-0 bg-muted'>
						<StoredImage
							imageKey={item.imageUrl}
							alt={item.name}
							className='size-full object-cover'
						/>
						<div className='absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent' />
					</div>
				) : (
					<div className='h-12 w-full shrink-0' />
				)}

				<div className='scrollbar-thin flex flex-col gap-4 overflow-y-auto px-6 pt-2 pb-2'>
					<DialogHeader className='text-left'>
						<DialogTitle className='text-2xl'>{item?.name}</DialogTitle>
						{item?.reason && (
							<DialogDescription className='text-primary'>
								{item.reason}
							</DialogDescription>
						)}
						{detail?.description && (
							<p className='text-sm text-muted-foreground'>
								{detail.description}
							</p>
						)}
					</DialogHeader>

					{isLoading ? (
						<div className='flex justify-center py-6'>
							<Spinner />
						</div>
					) : (
						<div className='flex flex-col gap-5'>
							{variants.length > 1 && (
								<div className='flex flex-col gap-2'>
									<span className='text-sm font-medium'>{t('menu.variant')}</span>
									<div className='flex flex-wrap gap-2'>
										{variants.map(v => (
											<button
												key={v.id}
												type='button'
												onClick={() => setVariantId(v.id)}
												className={cn(
													'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
													variantId === v.id
														? 'border-primary bg-primary text-primary-foreground'
														: 'border-border bg-card text-foreground hover:bg-muted'
												)}
											>
												{v.label ? `${v.label} - ` : ''}
												{v.isSeasonal || !v.price
													? t('menu.seasonal_price')
													: `${v.price} ${v.currency}`}
											</button>
										))}
									</div>
								</div>
							)}

							<div className='flex flex-col gap-2'>
								<span className='text-sm font-medium'>{t('orders.quantity')}</span>
								<div className='flex items-center gap-2'>
									<button
										type='button'
										onClick={() => setQuantity(q => Math.max(1, q - 1))}
										disabled={quantity <= 1}
										aria-label={t('table_plan.less')}
										className={stepClass}
									>
										<Minus className='size-4' />
									</button>
									<span className='w-8 text-center text-base font-medium text-foreground tabular-nums'>
										{quantity}
									</span>
									<button
										type='button'
										onClick={() => setQuantity(q => q + 1)}
										aria-label={t('table_plan.more')}
										className={stepClass}
									>
										<Plus className='size-4' />
									</button>
								</div>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className='flex-row gap-2 border-t border-border p-4'>
					<Button
						variant='outline'
						className='gap-1.5 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive'
						onClick={onRemove}
					>
						<Trash2 className='size-4' />
						{t('table_plan.remove')}
					</Button>
					<Button
						className='flex-1 rounded-full'
						disabled={!variantId || isLoading}
						onClick={save}
					>
						{t('table_plan.save_dish')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
