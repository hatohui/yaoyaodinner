import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	ListChecks,
	Minus,
	Plus,
	ShoppingCart,
	Sparkles,
	Star,
} from 'lucide-react'
import { useGetFoodById } from '@/api/foods/foods'
import { useGetTablePeople } from '@/api/tables/tables'
import type { FoodItemDto, FoodDetailDto, PersonDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
	SplitModeSelector,
	type SplitMode,
} from '@/components/common/SplitModeSelector'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { cn } from '@/utils/shadcn'
import { STALE_TIME_STATIC } from '@/common/constants'
import { StoredImage } from '@/components/common/StoredImage'

interface AddToCartModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	food: FoodItemDto | null
	tableId: string
	onAdd: (
		food: FoodItemDto,
		variantId: string,
		price: number,
		quantity: number,
		mode: SplitMode,
		chosen: Set<string>
	) => void
	onAddToPlan?: (
		food: FoodItemDto,
		variantId: string,
		kind: 'must' | 'want',
		quantity: number,
		personIds: string[]
	) => void
	defaultMode?: SplitMode
	defaultTarget?: 'cart' | 'plan'
}

export function AddToCartModal({
	open,
	onOpenChange,
	food,
	tableId,
	onAdd,
	onAddToPlan,
	defaultMode = 'table',
	defaultTarget = 'cart',
}: AddToCartModalProps) {
	const { t, i18n } = useTranslation()

	const { data: people = [], isLoading: peopleLoading } = useGetTablePeople<
		PersonDto[]
	>(tableId, { query: { enabled: open } })
	const { personId: myPersonId } = useWhoAmI(tableId)

	const { data: detail, isLoading: foodLoading } =
		useGetFoodById<FoodDetailDto>(
			food?.id ?? '',
			{ lang: i18n.language },
			{ query: { enabled: open && !!food, staleTime: STALE_TIME_STATIC } }
		)

	const [pickedVariantId, setPickedVariantId] = useState<string | null>(null)
	const [quantity, setQuantity] = useState(1)
	const [mode, setMode] = useState<SplitMode>('table')
	const [chosen, setChosen] = useState<Set<string>>(new Set())
	const [target, setTarget] = useState<'cart' | 'plan'>(defaultTarget)
	const [planKind, setPlanKind] = useState<'must' | 'want'>('must')

	const variants = detail?.variants ?? []
	const availableVariants = variants.filter(v => v.isAvailable)
	const variantId =
		availableVariants.find(v => v.id === pickedVariantId)?.id ??
		availableVariants.find(v => v.id === food?.defaultVariantId)?.id ??
		availableVariants[0]?.id ??
		food?.defaultVariantId ??
		''

	useEffect(() => {
		if (open) {
			setPickedVariantId(null)
			setQuantity(1)
			setMode(defaultMode === 'me' && !myPersonId ? 'choose' : defaultMode)
			setChosen(new Set())
			setTarget(onAddToPlan ? defaultTarget : 'cart')
			setPlanKind('must')
		}
	}, [open, food, defaultMode, defaultTarget, myPersonId, onAddToPlan])

	const toggleChosen = (personId: string) => {
		setChosen(prev => {
			const next = new Set(prev)
			if (next.has(personId)) next.delete(personId)
			else next.add(personId)
			return next
		})
	}

	const handleConfirm = () => {
		if (!food || !variantId) return
		if (target === 'plan' && onAddToPlan) {
			const personIds =
				mode === 'table'
					? []
					: mode === 'me'
						? myPersonId
							? [myPersonId]
							: []
						: [...chosen]
			onAddToPlan(food, variantId, planKind, quantity, personIds)
			onOpenChange(false)
			return
		}
		const selectedVariant = variants.find(v => v.id === variantId)
		const price = selectedVariant?.price ?? food.price ?? 0
		onAdd(
			{
				...food,
				currency: selectedVariant?.currency ?? food.currency ?? null,
				shouldCalculate: detail?.shouldCalculate ?? food.shouldCalculate,
			},
			variantId,
			price,
			quantity,
			mode,
			chosen
		)
		onOpenChange(false)
	}

	const canConfirm = () => {
		if (!variantId) return false
		if (mode === 'choose' && chosen.size === 0) return false
		if (mode === 'me' && !myPersonId) return false
		return true
	}

	const loading = peopleLoading || foodLoading

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[85vh] flex-col rounded-3xl p-0 sm:max-w-md overflow-hidden'>
				{food?.imageUrl ? (
					<div className='relative h-48 w-full bg-muted shrink-0'>
						<StoredImage
							imageKey={food.imageUrl}
							alt={food.name}
							className='size-full object-cover'
						/>
						<div className='absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent' />
					</div>
				) : (
					<div className='relative h-12 w-full shrink-0' />
				)}

				<div className='scrollbar-thin flex flex-col gap-4 overflow-y-auto px-6 pb-2 pt-2'>
					<DialogHeader className='text-left'>
						<DialogTitle className='text-2xl'>{food?.name}</DialogTitle>
						{detail?.description && (
							<p className='text-sm text-muted-foreground mt-1'>
								{detail.description}
							</p>
						)}
					</DialogHeader>

					{loading ? (
						<div className='flex justify-center py-8'>
							<Spinner />
						</div>
					) : (
						<div className='flex flex-col gap-5'>
							{onAddToPlan && (
								<div className='flex flex-col gap-2'>
									<span className='text-sm font-medium'>
										{t('plan_board.add_to_target')}
									</span>
									<div className='grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-control p-1'>
										<button
											type='button'
											aria-pressed={target === 'cart'}
											onClick={() => setTarget('cart')}
											className={cn(
												'flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors',
												target === 'cart'
													? 'bg-primary text-primary-foreground shadow-xs'
													: 'text-muted-foreground hover:text-foreground'
											)}
										>
											<ShoppingCart className='size-3.5' />
											{t('orders.cart')}
										</button>
										<button
											type='button'
											aria-pressed={target === 'plan'}
											onClick={() => setTarget('plan')}
											className={cn(
												'flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors',
												target === 'plan'
													? 'bg-primary text-primary-foreground shadow-xs'
													: 'text-muted-foreground hover:text-foreground'
											)}
										>
											<ListChecks className='size-3.5' />
											{t('plan_board.strip_title')}
										</button>
									</div>
									{target === 'plan' && (
										<div className='flex flex-wrap gap-2 pt-1'>
											{(
												[
													{ kind: 'must', icon: Star },
													{ kind: 'want', icon: Sparkles },
												] as const
											).map(({ kind, icon: Icon }) => (
												<button
													key={kind}
													type='button'
													aria-pressed={planKind === kind}
													onClick={() => setPlanKind(kind)}
													className={cn(
														'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
														planKind === kind
															? 'border-primary bg-primary text-primary-foreground'
															: 'border-border/60 bg-card text-foreground hover:bg-muted'
													)}
												>
													<Icon
														className={cn(
															'size-3.5',
															planKind === kind &&
																kind === 'must' &&
																'fill-current'
														)}
													/>
													{t(`plan_board.${kind}`)}
												</button>
											))}
										</div>
									)}
								</div>
							)}

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
													'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
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
										className='flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:opacity-40'
									>
										<Minus className='size-4' />
									</button>
									<span className='w-8 text-center text-base font-medium text-foreground'>
										{quantity}
									</span>
									<button
										type='button'
										onClick={() => setQuantity(q => q + 1)}
										className='flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
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
						</div>
					)}
				</div>

				<DialogFooter className='border-t border-border/40 p-4 shrink-0 bg-background'>
					<Button
						className='w-full rounded-full'
						size='lg'
						disabled={!canConfirm() || loading}
						onClick={handleConfirm}
					>
						{target === 'plan' && onAddToPlan
							? t('plan_board.add_to_plan_btn')
							: t('orders.add')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
