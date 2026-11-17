import { useTranslation } from 'react-i18next'
import {
	ArrowDown,
	ArrowUp,
	Check,
	ShoppingCart,
	TriangleAlert,
	X,
} from 'lucide-react'
import type {
	FoodVariantDto,
	PersonDto,
	TableWishDto,
	WishKind,
} from '@/api/model'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import type { WishStatus } from '@/hooks/useTableWishes'
import { cn } from '@/utils/shadcn'
import { WishDragHandle, useWishDrag } from './@WishDnd'
import { WishPeoplePicker } from './@WishPeoplePicker'
import { WishVariantPicker } from './@WishVariantPicker'

const KIND_ORDER: WishKind[] = ['must', 'want', 'avoid']

const iconButton =
	'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'

interface WishRowProps {
	rank: number
	wish: TableWishDto
	people: PersonDto[]
	status: WishStatus
	avoid: boolean
	canEdit: boolean
	canAddToCart: boolean
	onAddToCart: () => void
	onMove: (kind: WishKind) => void
	onVariantChange: (variant: FoodVariantDto) => void
	onPeopleChange: (personIds: string[]) => void
	onRemove: () => void
}

export function WishRow({
	rank,
	wish,
	people,
	status,
	avoid,
	canEdit,
	canAddToCart,
	onAddToCart,
	onMove,
	onVariantChange,
	onPeopleChange,
	onRemove,
}: WishRowProps) {
	const { t } = useTranslation()
	const drag = useWishDrag(wish.id)
	const index = KIND_ORDER.indexOf(wish.kind)
	// phones get arrows too: dragging inside a scrolling page is fiddly there
	const moves = [
		{ kind: KIND_ORDER[index - 1], icon: ArrowUp },
		{ kind: KIND_ORDER[index + 1], icon: ArrowDown },
	].filter((m): m is { kind: WishKind; icon: typeof ArrowUp } =>
		Boolean(m.kind)
	)

	return (
		<li
			ref={drag.ref}
			className={cn(
				'flex items-center gap-2 py-2 transition-colors',
				drag.isDragging && 'opacity-40',
				drag.isOver && 'bg-primary/10 ring-1 ring-inset ring-primary/50 rounded-lg'
			)}
		>
			{canEdit && (
				<WishDragHandle label={t('plan_board.drag')} handle={drag.handle} />
			)}
			<span className='w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground'>
				{rank}.
			</span>
			<OrderThumb
				imageKey={wish.foodImageUrl}
				alt={wish.name}
				className='size-9 rounded-lg'
			/>
			<div className='flex min-w-0 flex-1 flex-col'>
				<div className='flex min-w-0 items-center gap-1.5'>
					<span
						className={cn(
							'truncate text-sm text-foreground',
							status === 'ordered' &&
								!avoid &&
								'text-muted-foreground line-through'
						)}
					>
						{wish.name}
					</span>
					{canEdit && status !== 'ordered' && !wish.id.startsWith('draft-') ? (
						<WishVariantPicker wish={wish} onChange={onVariantChange} />
					) : (
						wish.variantLabel && (
							<span className='shrink-0 text-sm text-muted-foreground'>
								{wish.variantLabel}
							</span>
						)
					)}
				</div>
				{!wish.foodId && (
					<span className='text-[11px] text-muted-foreground'>
						{t('plan_board.off_menu')}
					</span>
				)}
				{wish.foodId && !avoid && (
					<WishPeoplePicker
						people={people}
						value={wish.personIds}
						canEdit={
							canEdit && status !== 'ordered' && !wish.id.startsWith('draft-')
						}
						onChange={onPeopleChange}
					/>
				)}
			</div>

			{avoid && status === 'ordered' && (
				<span
					title={t('plan_board.ordered_anyway')}
					className='flex shrink-0 items-center gap-1 rounded-full border border-destructive/50 px-1.5 py-0.5 text-[11px] font-semibold text-destructive sm:px-2'
				>
					<TriangleAlert className='size-3' />
					<span className='sr-only sm:not-sr-only'>
						{t('plan_board.ordered_anyway')}
					</span>
				</span>
			)}
			{!avoid && status === 'ordered' && (
				<span className='flex shrink-0 items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 sm:px-2 text-[11px] font-semibold text-primary-foreground'>
					<Check className='size-3' />
					<span className='sr-only sm:not-sr-only'>
						{t('plan_board.status_ordered')}
					</span>
				</span>
			)}
			{!avoid && status === 'in_cart' && (
				<span className='flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 sm:px-2 text-[11px] font-semibold text-primary'>
					<ShoppingCart className='size-3' />
					<span className='sr-only sm:not-sr-only'>
						{t('plan_board.status_in_cart')}
					</span>
				</span>
			)}
			{!avoid && status === 'open' && canAddToCart && wish.foodId && (
				<button
					type='button'
					aria-label={t('plan_board.add_to_cart')}
					title={t('plan_board.add_to_cart')}
					onClick={onAddToCart}
					className={iconButton}
				>
					<ShoppingCart className='size-4' />
				</button>
			)}

			{canEdit &&
				moves.map(({ kind, icon: Icon }) => {
					const label = t('plan_board.move_to', {
						list: t(`plan_board.${kind}`),
					})
					return (
						<button
							key={kind}
							type='button'
							aria-label={label}
							title={label}
							onClick={() => onMove(kind)}
							className={cn(iconButton, 'sm:hidden')}
						>
							<Icon className='size-4' />
						</button>
					)
				})}
			{canEdit && (
				<button
					type='button'
					aria-label={t('plan_board.remove')}
					title={t('plan_board.remove')}
					onClick={onRemove}
					className={cn(
						iconButton,
						'hover:bg-destructive/10 hover:text-destructive'
					)}
				>
					<X className='size-4' />
				</button>
			)}
		</li>
	)
}
