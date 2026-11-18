import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useGetFoodById } from '@/api/foods/foods'
import type {
	FoodDetailDto,
	FoodVariantDto,
	PersonDto,
	TableWishDto,
	WishKind,
} from '@/api/model'
import { STALE_TIME_STATIC } from '@/common/constants'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/utils/shadcn'

const KINDS: WishKind[] = ['must', 'want', 'avoid']

interface WishEditDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	wish: TableWishDto
	people: PersonDto[]
	canEditDetails: boolean
	onMove: (kind: WishKind) => void
	onVariantChange: (variant: FoodVariantDto) => void
	onPeopleChange: (personIds: string[]) => void
	onQuantityChange: (quantity: number) => void
	onRemove: () => void
}

/** Mobile-friendly modal for editing a planned dish's list, size, quantity, and split. */
export function WishEditDialog({
	open,
	onOpenChange,
	wish,
	people,
	canEditDetails,
	onMove,
	onVariantChange,
	onPeopleChange,
	onQuantityChange,
	onRemove,
}: WishEditDialogProps) {
	const { t, i18n } = useTranslation()
	const { data: food } = useGetFoodById<FoodDetailDto>(
		wish.foodId ?? '',
		{ lang: i18n.language },
		{
			query: {
				enabled: open && Boolean(wish.foodId),
				staleTime: STALE_TIME_STATIC,
			},
		}
	)
	const variants = (food?.variants ?? []).filter(
		v => v.isAvailable || v.id === wish.variantId
	)

	const [draftKind, setDraftKind] = useState<WishKind>(wish.kind)
	const [draftVariantId, setDraftVariantId] = useState(wish.variantId ?? '')
	const [draftPersonIds, setDraftPersonIds] = useState<Set<string>>(new Set())
	const [draftQuantity, setDraftQuantity] = useState(wish.quantity ?? 1)

	useEffect(() => {
		if (!open) return
		const seated = new Set(people.map(p => p.id))
		setDraftKind(wish.kind)
		setDraftVariantId(wish.variantId ?? '')
		setDraftPersonIds(new Set(wish.personIds.filter(id => seated.has(id))))
		setDraftQuantity(wish.quantity ?? 1)
	}, [open, wish.kind, wish.variantId, wish.personIds, wish.quantity, people])

	const togglePerson = (id: string) =>
		setDraftPersonIds(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})

	const handleSave = () => {
		if (draftKind !== wish.kind) {
			onMove(draftKind)
		}
		if (canEditDetails && draftKind !== 'avoid') {
			if (draftVariantId && draftVariantId !== wish.variantId) {
				const next = variants.find(v => v.id === draftVariantId)
				if (next) onVariantChange(next)
			}
			const seated = new Set(people.map(p => p.id))
			const current = wish.personIds.filter(id => seated.has(id))
			if (
				draftPersonIds.size !== current.length ||
				current.some(id => !draftPersonIds.has(id))
			) {
				onPeopleChange([...draftPersonIds])
			}
			if (draftQuantity !== (wish.quantity ?? 1)) {
				onQuantityChange(draftQuantity)
			}
		}
		onOpenChange(false)
	}

	const chipClass = (active: boolean, destructive = false) =>
		cn(
			'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
			active
				? destructive
					? 'border-destructive bg-destructive text-white'
					: 'border-primary bg-primary text-primary-foreground'
				: 'border-border bg-control text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
		)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[85vh] flex-col gap-4 overflow-hidden rounded-3xl p-5 sm:max-w-md'>
				<DialogHeader className='flex-row items-center gap-3 text-left'>
					<OrderThumb
						imageKey={wish.foodImageUrl}
						alt={wish.name}
						className='size-11 rounded-xl'
					/>
					<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
						<DialogTitle className='line-clamp-2 text-base'>
							{wish.name}
						</DialogTitle>
						{!wish.foodId && (
							<DialogDescription className='text-xs'>
								{t('plan_board.off_menu')}
							</DialogDescription>
						)}
					</div>
				</DialogHeader>

				<div className='scrollbar-thin flex flex-col gap-4 overflow-y-auto'>
					<div className='flex flex-wrap gap-2'>
						{KINDS.map(kind => (
							<button
								key={kind}
								type='button'
								onClick={() => setDraftKind(kind)}
								className={chipClass(draftKind === kind, kind === 'avoid')}
							>
								{t(`plan_board.${kind}`)}
							</button>
						))}
					</div>

					{canEditDetails && draftKind !== 'avoid' && variants.length > 1 && (
						<div className='flex flex-col gap-2'>
							<span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
								{t('menu.variant')}
							</span>
							<div className='flex flex-wrap gap-2'>
								{variants.map(v => (
									<button
										key={v.id}
										type='button'
										onClick={() => setDraftVariantId(v.id)}
										className={chipClass(draftVariantId === v.id)}
									>
										{v.label || t('admin.food.default_variant_label')}
										{v.price && v.price > 0
											? ` · ${v.price} ${v.currency}`
											: ''}
									</button>
								))}
							</div>
						</div>
					)}

					{canEditDetails && draftKind !== 'avoid' && wish.foodId && (
						<div className='flex items-center justify-between gap-3'>
							<span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
								{t('orders.quantity')}
							</span>
							<div className='flex items-center gap-2'>
								<button
									type='button'
									onClick={() => setDraftQuantity(q => Math.max(1, q - 1))}
									disabled={draftQuantity <= 1}
									aria-label={t('orders.decrease')}
									className='flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-control text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:opacity-40'
								>
									<Minus className='size-3.5' />
								</button>
								<span className='min-w-6 text-center text-sm font-semibold tabular-nums text-foreground'>
									{draftQuantity}
								</span>
								<button
									type='button'
									onClick={() => setDraftQuantity(q => Math.min(99, q + 1))}
									disabled={draftQuantity >= 99}
									aria-label={t('orders.increase')}
									className='flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-control text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:opacity-40'
								>
									<Plus className='size-3.5' />
								</button>
							</div>
						</div>
					)}

					{canEditDetails && draftKind !== 'avoid' && wish.foodId && (
						<div className='flex flex-col gap-2'>
							<div className='flex flex-col gap-0.5'>
								<span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
									{t('plan_board.who_for')}
								</span>
								<p className='text-xs text-muted-foreground'>
									{t('plan_board.who_hint')}
								</p>
							</div>
							<div className='flex flex-wrap gap-2'>
								<button
									type='button'
									onClick={() => setDraftPersonIds(new Set())}
									className={chipClass(draftPersonIds.size === 0)}
								>
									{t('plan_board.whole_table')}
								</button>
								{people.map(person => (
									<button
										key={person.id}
										type='button'
										onClick={() => togglePerson(person.id)}
										className={chipClass(draftPersonIds.has(person.id))}
									>
										{person.name}
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				<DialogFooter className='flex-row gap-2 border-t border-border pt-4'>
					<Button
						type='button'
						variant='outline'
						onClick={() => {
							onRemove()
							onOpenChange(false)
						}}
						className='gap-1.5 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive'
					>
						<Trash2 className='size-4' />
						{t('plan_board.remove')}
					</Button>
					<Button
						type='button'
						onClick={handleSave}
						className='flex-1 rounded-full'
					>
						{t('table_plan.save_dish')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
