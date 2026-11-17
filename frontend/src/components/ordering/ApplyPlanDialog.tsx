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
import { OrderThumb } from '@/components/ordering/OrderThumb'
import type { WishStatus } from '@/hooks/useTableWishes'
import { awaitingPrice, billingCurrency } from '@/utils/money'

type Skip = 'ordered' | 'in_cart' | 'unlisted'

const SKIP_ICON = { ordered: Check, in_cart: ShoppingCart, unlisted: PenLine }

interface ApplyPlanDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	wishes: TableWishDto[]
	people: PersonDto[]
	statusOf: (wish: TableWishDto) => WishStatus
	onConfirm: (wishes: TableWishDto[]) => void
}

/** Shows which plan dishes would land in the cart, and which are skipped and why. */
export function ApplyPlanDialog({
	open,
	onOpenChange,
	wishes,
	people,
	statusOf,
	onConfirm,
}: ApplyPlanDialogProps) {
	const { t } = useTranslation()
	const whoFor = (wish: TableWishDto) =>
		people
			.filter(p => wish.personIds.includes(p.id))
			.map(p => p.name)
			.join(', ')

	const { addable, skipped } = useMemo(() => {
		const addable: TableWishDto[] = []
		const skipped: { wish: TableWishDto; reason: Skip }[] = []
		const planned = wishes
			.filter(w => w.kind !== 'avoid')
			.sort((a, b) => Number(b.kind === 'must') - Number(a.kind === 'must'))
		for (const wish of planned) {
			const status = statusOf(wish)
			if (!wish.foodId || !wish.variantId)
				skipped.push({ wish, reason: 'unlisted' })
			else if (status === 'open') addable.push(wish)
			else skipped.push({ wish, reason: status })
		}
		return { addable, skipped }
	}, [wishes, statusOf])

	// everything starts ticked, so track what was unticked
	const [unpicked, setUnpicked] = useState<Set<string>>(new Set())
	const chosen = addable.filter(w => !unpicked.has(w.id))
	const total = chosen.reduce(
		(sum, w) => (w.shouldCalculate ? sum + (w.price ?? 0) : sum),
		0
	)

	const toggle = (id: string) =>
		setUnpicked(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})

	const setOpen = (next: boolean) => {
		if (!next) setUnpicked(new Set())
		onOpenChange(next)
	}

	const confirm = () => {
		onConfirm(chosen)
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='gap-4 rounded-3xl sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{t('plan_board.apply_title')}</DialogTitle>
					<DialogDescription>{t('plan_board.apply_body')}</DialogDescription>
				</DialogHeader>

				<ul className='scrollbar-thin -mx-1 flex max-h-[45vh] flex-col overflow-y-auto px-1'>
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
									</span>
									<span className='flex items-center gap-1 truncate text-[11px] text-muted-foreground'>
										<Users className='size-3 shrink-0' />
										{whoFor(wish) || t('plan_board.whole_table')}
									</span>
								</span>
								<span className='shrink-0 text-xs tabular-nums text-muted-foreground'>
									{awaitingPrice(wish)
										? t('table_plan.price_pending')
										: `${(wish.price ?? 0).toFixed(2)} ${wish.currency}`}
								</span>
							</label>
						</li>
					))}
				</ul>

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

				<DialogFooter className='flex-row items-center gap-2 sm:justify-between'>
					<p className='mr-auto text-sm text-muted-foreground'>
						{t('plan_board.apply_total', {
							amount: `${total.toFixed(2)} ${billingCurrency(chosen)}`,
						})}
					</p>
					<Button
						variant='outline'
						className='rounded-full'
						onClick={() => setOpen(false)}
					>
						{t('common.cancel')}
					</Button>
					<Button
						className='gap-1.5 rounded-full'
						disabled={chosen.length === 0}
						onClick={confirm}
					>
						<ShoppingCart className='size-4' />
						{t('plan_board.apply_confirm', { count: chosen.length })}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
