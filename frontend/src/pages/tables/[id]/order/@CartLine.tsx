import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, Trash2, ChevronDown } from 'lucide-react'
import { useGetFoodById } from '@/api/foods/foods'
import type { FoodDetailDto, PersonDto } from '@/api/model'
import type { SplitMode } from '@/components/common/SplitModeSelector'
import { SplitModeSelector } from '@/components/common/SplitModeSelector'
import { StoredImage } from '@/components/common/StoredImage'
import { STALE_TIME_STATIC } from '@/common/constants'
import { cn } from '@/utils/shadcn'
import type { CartLine as CartLineData } from './@useOrderCart'

interface CartLineProps {
	line: CartLineData
	people: PersonDto[]
	myPersonId: string | null
	onQuantityChange: (quantity: number) => void
	onModeChange: (mode: SplitMode) => void
	onVariantChange: (variantId: string, price: number) => void
	onTogglePerson: (personId: string) => void
	onRemove: () => void
}

export function CartLine({
	line,
	people,
	myPersonId,
	onQuantityChange,
	onModeChange,
	onVariantChange,
	onTogglePerson,
	onRemove,
}: CartLineProps) {
	const { t, i18n } = useTranslation()
	const [open, setOpen] = useState(false)

	const { data: detail } = useGetFoodById<FoodDetailDto>(
		line.foodId,
		{ lang: i18n.language },
		{ query: { staleTime: STALE_TIME_STATIC, enabled: open } }
	)
	const variants = detail?.variants ?? []

	const splitLabel =
		line.mode === 'me'
			? t('split.just_me')
			: line.mode === 'table'
				? t('split.whole_table')
				: t('split.people_count', { count: line.chosen.size })

	return (
		<li className='flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-3'>
			<div className='flex gap-3'>
				<div className='size-14 shrink-0 overflow-hidden rounded-xl bg-muted'>
					<StoredImage
						imageKey={line.imageUrl}
						alt={line.name}
						className='size-full object-cover'
						fallback={
							<div className='flex size-full items-center justify-center text-xl'>
								🍽️
							</div>
						}
					/>
				</div>

				<div className='flex min-w-0 flex-1 flex-col gap-1'>
					<div className='flex items-start justify-between gap-2'>
						<span className='truncate text-sm font-medium text-foreground'>
							{line.name}
						</span>
						<button
							type='button'
							onClick={onRemove}
							aria-label={t('orders.remove_from_cart')}
							className='shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
						>
							<Trash2 className='size-4' />
						</button>
					</div>

					<div className='flex items-center justify-between gap-2'>
						<span className='text-sm font-semibold text-primary'>
							{line.shouldCalculate
								? `${(line.price * line.quantity).toFixed(2)} ${line.currency}`
								: t('orders.free')}
						</span>

						<div className='flex items-center gap-1 rounded-full border border-border/60'>
							<button
								type='button'
								onClick={() => onQuantityChange(line.quantity - 1)}
								aria-label={t('orders.decrease')}
								className='flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
							>
								<Minus className='size-3.5' />
							</button>
							<span className='min-w-5 text-center text-sm font-medium text-foreground'>
								{line.quantity}
							</span>
							<button
								type='button'
								onClick={() => onQuantityChange(line.quantity + 1)}
								aria-label={t('orders.increase')}
								className='flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
							>
								<Plus className='size-3.5' />
							</button>
						</div>
					</div>
				</div>
			</div>

			<button
				type='button'
				onClick={() => setOpen(v => !v)}
				aria-expanded={open}
				className='flex items-center justify-between rounded-xl px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted'
			>
				<span>
					{t('orders.split_as')}{' '}
					<span className='font-medium'>{splitLabel}</span>
				</span>
				<ChevronDown
					className={cn('size-3.5 transition-transform', open && 'rotate-180')}
				/>
			</button>

			{open && (
				<div className='flex flex-col gap-3 px-2 pb-1'>
					{variants.length > 1 && (
						<div className='flex flex-wrap gap-2'>
							{variants
								.filter(v => v.isAvailable)
								.map(v => (
									<button
										key={v.id}
										type='button'
										onClick={() => onVariantChange(v.id, v.price ?? 0)}
										className={cn(
											'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
											line.variantId === v.id
												? 'border-primary bg-primary text-primary-foreground'
												: 'border-border/60 bg-card text-foreground hover:bg-muted'
										)}
									>
										{v.label ? `${v.label} - ` : ''}
										{v.price} {v.currency}
									</button>
								))}
						</div>
					)}
					<SplitModeSelector
						people={people}
						mode={line.mode}
						onModeChange={onModeChange}
						chosen={line.chosen}
						onToggle={onTogglePerson}
						myPersonId={myPersonId}
					/>
				</div>
			)}
		</li>
	)
}
