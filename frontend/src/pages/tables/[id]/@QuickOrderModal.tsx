import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import { useGetFoodById } from '@/api/foods/foods'
import type { FoodDetailDto, PersonDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
	SplitModeSelector,
	type SplitMode,
} from '@/components/common/SplitModeSelector'
import { STALE_TIME_STATIC } from '@/common/constants'
import { cn } from '@/utils/shadcn'

const MAX_QUANTITY = 99

export interface QuickOrderTarget {
	foodId: string
	variantId: string
	foodName: string
}

interface QuickOrderModalProps {
	target: QuickOrderTarget | null
	onOpenChange: (open: boolean) => void
	people: PersonDto[]
	myPersonId?: string | null
	isSubmitting?: boolean
	onConfirm: (data: {
		variantId: string
		quantity: number
		splitAll: boolean
		personIds: string[]
	}) => Promise<void> | void
}

/** Quick-adds another portion or variation of an already-ordered dish for specific people. */
export function QuickOrderModal({
	target,
	onOpenChange,
	people,
	myPersonId,
	isSubmitting = false,
	onConfirm,
}: QuickOrderModalProps) {
	const { t, i18n } = useTranslation()
	const open = Boolean(target)

	const { data: detail, isLoading } = useGetFoodById<FoodDetailDto>(
		target?.foodId ?? '',
		{ lang: i18n.language },
		{ query: { enabled: open, staleTime: STALE_TIME_STATIC } }
	)

	const [pickedVariantId, setPickedVariantId] = useState<string | null>(null)
	const [quantity, setQuantity] = useState(1)
	const [mode, setMode] = useState<SplitMode>('choose')
	const [chosen, setChosen] = useState<Set<string>>(new Set())

	useEffect(() => {
		if (!target) return
		setPickedVariantId(target.variantId)
		setQuantity(1)
		setMode('choose')
		setChosen(new Set())
	}, [target])

	const availableVariants = (detail?.variants ?? []).filter(v => v.isAvailable)
	const variantId =
		availableVariants.find(v => v.id === pickedVariantId)?.id ??
		availableVariants.find(v => v.id === target?.variantId)?.id ??
		availableVariants[0]?.id ??
		target?.variantId ??
		''

	const toggleChosen = (personId: string) => {
		setChosen(prev => {
			const next = new Set(prev)
			if (next.has(personId)) next.delete(personId)
			else next.add(personId)
			return next
		})
	}

	const canConfirm =
		Boolean(variantId) &&
		!isSubmitting &&
		(mode !== 'choose' || chosen.size > 0) &&
		(mode !== 'me' || Boolean(myPersonId))

	const handleConfirm = async () => {
		if (!canConfirm) return
		const splitAll = mode === 'table'
		const personIds = splitAll
			? []
			: mode === 'me' && myPersonId
				? [myPersonId]
				: [...chosen]
		await onConfirm({ variantId, quantity, splitAll, personIds })
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[85vh] flex-col overflow-hidden rounded-3xl p-0 sm:max-w-md'>
				<DialogHeader className='px-6 pt-6 pb-2 text-left'>
					<DialogTitle>{target?.foodName}</DialogTitle>
				</DialogHeader>

				<div className='scrollbar-thin flex flex-col gap-5 overflow-y-auto px-6 py-2'>
					{isLoading ? (
						<div className='flex justify-center py-8'>
							<Spinner />
						</div>
					) : (
						<>
							{availableVariants.length > 1 && (
								<div className='flex flex-col gap-2'>
									<span className='text-sm font-medium'>
										{t('menu.variant')}
									</span>
									<div className='flex flex-wrap gap-2'>
										{availableVariants.map(v => (
											<button
												key={v.id}
												type='button'
												onClick={() => setPickedVariantId(v.id)}
												className={cn(
													'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
													variantId === v.id
														? 'border-primary bg-primary text-primary-foreground'
														: 'border-border/60 bg-card text-foreground hover:bg-muted'
												)}
											>
												{v.label ? `${v.label} - ` : ''}
												{v.isSeasonal || !v.price || v.price <= 0
													? t('menu.seasonal_price')
													: `${v.price} ${v.currency}`}
											</button>
										))}
									</div>
								</div>
							)}

							<div className='flex flex-col gap-2'>
								<span className='text-sm font-medium'>
									{t('orders.quantity')}
								</span>
								<div className='flex items-center gap-2'>
									<button
										type='button'
										onClick={() => setQuantity(q => Math.max(1, q - 1))}
										disabled={quantity <= 1}
										aria-label={t('orders.decrease')}
										className='flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:opacity-40'
									>
										<Minus className='size-4' />
									</button>
									<span className='w-8 text-center text-base font-medium text-foreground tabular-nums'>
										{quantity}
									</span>
									<button
										type='button'
										onClick={() =>
											setQuantity(q => Math.min(MAX_QUANTITY, q + 1))
										}
										disabled={quantity >= MAX_QUANTITY}
										aria-label={t('orders.increase')}
										className='flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:opacity-40'
									>
										<Plus className='size-4' />
									</button>
								</div>
							</div>

							<div className='flex flex-col gap-2'>
								<span className='text-sm font-medium'>
									{t('orders.split_as')}
								</span>
								<SplitModeSelector
									people={people}
									mode={mode}
									onModeChange={setMode}
									chosen={chosen}
									onToggle={toggleChosen}
									myPersonId={myPersonId}
								/>
							</div>
						</>
					)}
				</div>

				<DialogFooter className='shrink-0 border-t border-border/40 bg-background p-4'>
					<Button
						className='w-full rounded-full'
						size='lg'
						disabled={!canConfirm || isLoading}
						onClick={handleConfirm}
					>
						{isSubmitting ? t('orders.placing') : t('orders.add')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
