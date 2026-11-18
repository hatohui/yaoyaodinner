import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, PenLine, ShoppingCart, Star, Users } from 'lucide-react'
import type { PersonDto, TableWishDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import type { CartLine } from '@/hooks/useOrderCart'
import type { WishStatus } from '@/hooks/useTableWishes'
import { awaitingPrice, billingCurrency } from '@/utils/money'

type Skip = 'ordered' | 'in_cart' | 'unlisted'

const SKIP_ICON = { ordered: Check, in_cart: ShoppingCart, unlisted: PenLine }

export interface ApplyPlanSelection {
	wishes: TableWishDto[]
	cartFoodIds: string[]
}

interface ApplyPlanDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	wishes: TableWishDto[]
	cartLines?: CartLine[]
	myPersonId?: string | null
	people: PersonDto[]
	statusOf: (wish: TableWishDto) => WishStatus
	isSubmitting?: boolean
	onConfirm: (
		selection: ApplyPlanSelection
	) => boolean | void | Promise<boolean | void>
}

/** Shows which plan dishes and cart items will be placed into the table order, and which are skipped. */
export function ApplyPlanDialog({
	open,
	onOpenChange,
	wishes,
	cartLines = [],
	myPersonId = null,
	people,
	statusOf,
	isSubmitting = false,
	onConfirm,
}: ApplyPlanDialogProps) {
	const { t } = useTranslation()
	const peopleById = useMemo(
		() => new Map(people.map(p => [p.id, p.name])),
		[people]
	)
	const whoFor = (wish: TableWishDto) =>
		people
			.filter(p => wish.personIds.includes(p.id))
			.map(p => p.name)
			.join(', ')

	const whoForCart = (line: CartLine) => {
		if (line.mode === 'table') return t('plan_board.whole_table')
		if (line.mode === 'me') {
			return (myPersonId && peopleById.get(myPersonId)) || t('split.just_me')
		}
		const names = people
			.filter(p => line.chosen.has(p.id))
			.map(p => p.name)
			.join(', ')
		return names || t('plan_board.whole_table')
	}

	const { addable, skipped } = useMemo(() => {
		const cartFoodIds = new Set(cartLines.map(l => l.foodId))
		const addable: TableWishDto[] = []
		const skipped: { wish: TableWishDto; reason: Skip }[] = []
		const planned = wishes
			.filter(w => w.kind !== 'avoid')
			.sort((a, b) => Number(b.kind === 'must') - Number(a.kind === 'must'))
		for (const wish of planned) {
			const status = statusOf(wish)
			if (!wish.foodId || !wish.variantId)
				skipped.push({ wish, reason: 'unlisted' })
			else if (status === 'ordered') skipped.push({ wish, reason: 'ordered' })
			else if (cartFoodIds.has(wish.foodId)) continue
			else if (status === 'open') addable.push(wish)
			else skipped.push({ wish, reason: status })
		}
		return { addable, skipped }
	}, [wishes, cartLines, statusOf])

	// everything starts ticked, so track what was unticked
	const [unpicked, setUnpicked] = useState<Set<string>>(new Set())
	const chosenWishes = addable.filter(w => !unpicked.has(w.id))
	const chosenCart = cartLines.filter(l => !unpicked.has(`cart:${l.foodId}`))
	const chosenCount = chosenWishes.length + chosenCart.length
	const total =
		chosenWishes.reduce(
			(sum, w) =>
				w.shouldCalculate ? sum + (w.price ?? 0) * (w.quantity ?? 1) : sum,
			0
		) +
		chosenCart.reduce(
			(sum, l) => (l.shouldCalculate ? sum + l.price * l.quantity : sum),
			0
		)

	const toggle = (key: string) =>
		setUnpicked(prev => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})

	const setOpen = (next: boolean) => {
		if (!next) setUnpicked(new Set())
		onOpenChange(next)
	}

	const confirm = async () => {
		const ok = await onConfirm({
			wishes: chosenWishes,
			cartFoodIds: chosenCart.map(l => l.foodId),
		})
		if (ok !== false) setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='gap-4 rounded-3xl sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{t('plan_board.apply_title')}</DialogTitle>
					<DialogDescription>{t('plan_board.apply_body')}</DialogDescription>
				</DialogHeader>

				{(addable.length > 0 || cartLines.length > 0) && (
					<div className='scrollbar-thin -mx-1 flex max-h-[45vh] flex-col gap-3 overflow-y-auto px-1'>
						{addable.length > 0 && (
							<ul className='flex flex-col'>
								{addable.map(wish => (
									<li key={wish.id}>
										<label className='flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-primary/5'>
											<Checkbox
												checked={!unpicked.has(wish.id)}
												onCheckedChange={() => toggle(wish.id)}
											/>
											<OrderThumb
												imageKey={wish.foodImageUrl}
												alt={wish.name}
												className='size-10 rounded-lg'
											/>
											<span className='flex min-w-0 flex-1 flex-col'>
												<span className='flex min-w-0 items-center gap-1.5 text-sm text-foreground'>
													{wish.kind === 'must' && (
														<Star className='size-3.5 shrink-0 fill-primary text-primary' />
													)}
													<span className='truncate'>{wish.name}</span>
													{(wish.quantity ?? 1) > 1 && (
														<span className='shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary'>
															×{wish.quantity}
														</span>
													)}
												</span>
												<span className='flex items-center gap-1 truncate text-[11px] text-muted-foreground'>
													<Users className='size-3 shrink-0' />
													{whoFor(wish) || t('plan_board.whole_table')}
												</span>
											</span>
											<span className='shrink-0 text-xs tabular-nums text-muted-foreground'>
												{awaitingPrice(wish)
													? t('table_plan.price_pending')
													: `${((wish.price ?? 0) * (wish.quantity ?? 1)).toFixed(2)} ${wish.currency}`}
											</span>
										</label>
									</li>
								))}
							</ul>
						)}

						{cartLines.length > 0 && (
							<div className='flex flex-col gap-1'>
								<p className='flex items-center gap-1.5 px-2 text-xs font-semibold text-primary'>
									<ShoppingCart className='size-3.5 shrink-0' />
									{t('plan_board.apply_from_cart')}
								</p>
								<ul className='flex flex-col'>
									{cartLines.map(line => {
										const key = `cart:${line.foodId}`
										return (
											<li key={key}>
												<label className='flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-primary/5'>
													<Checkbox
														checked={!unpicked.has(key)}
														onCheckedChange={() => toggle(key)}
													/>
													<OrderThumb
														imageKey={line.imageUrl}
														alt={line.name}
														className='size-10 rounded-lg'
													/>
													<span className='flex min-w-0 flex-1 flex-col'>
														<span className='flex min-w-0 items-center gap-1.5 text-sm text-foreground'>
															<span className='truncate'>{line.name}</span>
															{line.quantity > 1 && (
																<span className='shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary'>
																	×{line.quantity}
																</span>
															)}
														</span>
														<span className='flex items-center gap-1 truncate text-[11px] text-muted-foreground'>
															<Users className='size-3 shrink-0' />
															{whoForCart(line)}
														</span>
													</span>
													<span className='shrink-0 text-xs tabular-nums text-muted-foreground'>
														{!line.shouldCalculate
															? t('orders.free')
															: awaitingPrice(line)
																? t('table_plan.price_pending')
																: `${(line.price * line.quantity).toFixed(2)} ${line.currency}`}
													</span>
												</label>
											</li>
										)
									})}
								</ul>
							</div>
						)}
					</div>
				)}

				{skipped.length > 0 && (
					<div className='flex flex-col gap-1.5 rounded-2xl bg-muted/60 px-3 py-2.5'>
						<p className='text-xs font-semibold text-muted-foreground'>
							{t('plan_board.apply_skipped')}
						</p>
						<ul className='flex flex-col gap-1'>
							{skipped.map(({ wish, reason }) => {
								const Icon = SKIP_ICON[reason]
								return (
									<li
										key={wish.id}
										className='flex items-center gap-2 text-xs text-muted-foreground'
									>
										<Icon className='size-3.5 shrink-0' />
										<span className='min-w-0 flex-1 truncate text-foreground'>
											{wish.name}
										</span>
										<span className='shrink-0'>
											{t(`plan_board.skip_${reason}`)}
										</span>
									</li>
								)
							})}
						</ul>
					</div>
				)}

				<DialogFooter className='flex-row justify-end gap-2'>
					<Button
						variant='destructive'
						className='rounded-full'
						disabled={isSubmitting}
						onClick={() => setOpen(false)}
					>
						{t('common.cancel')}
					</Button>
					<Button
						className='gap-1.5 rounded-full'
						disabled={chosenCount === 0 || isSubmitting}
						onClick={confirm}
					>
						{isSubmitting ? (
							<Spinner className='size-4' />
						) : (
							<Check className='size-4' />
						)}
						{t('plan_board.apply_confirm', { count: chosenCount })}
						{chosenCount > 0 &&
							` · ${total.toFixed(2)} ${billingCurrency([...chosenWishes, ...chosenCart])}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
