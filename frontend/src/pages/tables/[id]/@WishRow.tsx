import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Check,
	Pencil,
	ShoppingCart,
	TriangleAlert,
	Users,
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
import { WishEditDialog } from './@WishEditDialog'
import { WishPeoplePicker } from './@WishPeoplePicker'
import { WishVariantPicker } from './@WishVariantPicker'

const iconButton =
	'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'

const cartButton =
	'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary hover:text-primary-foreground'

interface WishRowProps {
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
	const [editingOpen, setEditingOpen] = useState(false)

	const canEditDetails =
		canEdit && status !== 'ordered' && !wish.id.startsWith('draft-')

	const variantControl =
		!avoid &&
		(canEditDetails ? (
			<WishVariantPicker wish={wish} onChange={onVariantChange} />
		) : (
			wish.variantLabel && (
				<span className='inline-flex h-5 shrink-0 items-center rounded-md border border-border/60 bg-muted/40 px-1.5 text-[11px] font-medium text-muted-foreground'>
					{wish.variantLabel}
				</span>
			)
		))

	const seatedIds = new Set(people.map(p => p.id))
	const selectedNames = people
		.filter(p => seatedIds.has(p.id) && wish.personIds.includes(p.id))
		.map(p => p.name)
	const peopleLabel = selectedNames.length
		? selectedNames.join(', ')
		: t('plan_board.whole_table')
	const showPeople = Boolean(
		wish.foodId && !avoid && (canEditDetails || selectedNames.length > 0)
	)

	const peopleControl = showPeople && (
		<WishPeoplePicker
			people={people}
			value={wish.personIds}
			canEdit={canEditDetails}
			onChange={onPeopleChange}
		/>
	)

	const hasMeta = !wish.foodId || Boolean(variantControl) || showPeople
	const hasMobileMeta =
		!wish.foodId || (!avoid && (Boolean(wish.variantLabel) || showPeople))

	const statusControl = (
		<>
			{avoid && status === 'ordered' && (
				<span
					title={t('plan_board.ordered_anyway')}
					className='inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-destructive/50 px-2 text-[11px] font-semibold text-destructive'
				>
					<TriangleAlert className='size-3' />
					<span>{t('plan_board.ordered_anyway')}</span>
				</span>
			)}
			{!avoid && status === 'ordered' && (
				<span className='inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-primary px-2 text-[11px] font-semibold text-primary-foreground'>
					<Check className='size-3' />
					<span>{t('plan_board.status_ordered')}</span>
				</span>
			)}
			{!avoid && status === 'in_cart' && (
				<span className='inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 text-[11px] font-semibold text-primary'>
					<ShoppingCart className='size-3' />
					<span>{t('plan_board.status_in_cart')}</span>
				</span>
			)}
			{!avoid && status === 'open' && canAddToCart && wish.foodId && (
				<button
					type='button'
					aria-label={t('plan_board.add_to_cart')}
					title={t('plan_board.add_to_cart')}
					onClick={onAddToCart}
					className={cartButton}
				>
					<ShoppingCart className='size-3.5' />
				</button>
			)}
		</>
	)

	return (
		<li
			ref={drag.ref}
			className={cn(
				'flex items-center gap-2.5 py-2.5 transition-colors',
				drag.isDragging && 'opacity-40',
				drag.isOver &&
					'rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/50'
			)}
		>
			{canEdit && (
				<WishDragHandle label={t('plan_board.drag')} handle={drag.handle} />
			)}
			<OrderThumb
				imageKey={wish.foodImageUrl}
				alt={wish.name}
				className='size-10 rounded-xl sm:size-11'
			/>
			<div className='flex min-w-0 flex-1 flex-col justify-center gap-0.5 sm:gap-1'>
				<span
					title={wish.name}
					className={cn(
						'truncate text-sm leading-tight font-medium text-foreground',
						status === 'ordered' &&
							!avoid &&
							'text-muted-foreground line-through'
					)}
				>
					{wish.name}
				</span>

				{hasMobileMeta && (
					<div className='flex min-w-0 items-center gap-1.5 text-xs leading-tight text-muted-foreground sm:hidden'>
						{!wish.foodId && (
							<span className='shrink-0'>{t('plan_board.off_menu')}</span>
						)}
						{!avoid && wish.variantLabel && (
							<span className='shrink-0 font-medium text-foreground/80'>
								{wish.variantLabel}
							</span>
						)}
						{!avoid && wish.variantLabel && showPeople && (
							<span className='shrink-0 text-muted-foreground/50'>·</span>
						)}
						{showPeople && (
							<span
								className={cn(
									'inline-flex min-w-0 items-center gap-1 truncate',
									selectedNames.length && 'font-medium text-primary'
								)}
							>
								<Users className='size-3 shrink-0' />
								<span className='truncate'>{peopleLabel}</span>
							</span>
						)}
					</div>
				)}

				{hasMeta && (
					<div className='hidden min-w-0 items-center gap-1.5 overflow-hidden sm:flex'>
						{!wish.foodId && (
							<span className='shrink-0 text-[11px] text-muted-foreground'>
								{t('plan_board.off_menu')}
							</span>
						)}
						{variantControl}
						{peopleControl}
					</div>
				)}
			</div>

			<div className='flex shrink-0 items-center gap-1'>
				{statusControl}
				{canEdit && (
					<button
						type='button'
						aria-label={t('common.edit')}
						title={t('common.edit')}
						onClick={() => setEditingOpen(true)}
						className={cn(iconButton, 'sm:hidden')}
					>
						<Pencil className='size-3.5' />
					</button>
				)}
				{canEdit && (
					<button
						type='button'
						aria-label={t('plan_board.remove')}
						title={t('plan_board.remove')}
						onClick={onRemove}
						className={cn(
							iconButton,
							'hidden hover:bg-destructive/10 hover:text-destructive sm:flex'
						)}
					>
						<X className='size-3.5' />
					</button>
				)}
			</div>

			{canEdit && (
				<WishEditDialog
					open={editingOpen}
					onOpenChange={setEditingOpen}
					wish={wish}
					people={people}
					canEditDetails={canEditDetails}
					onMove={onMove}
					onVariantChange={onVariantChange}
					onPeopleChange={onPeopleChange}
					onRemove={onRemove}
				/>
			)}
		</li>
	)
}
