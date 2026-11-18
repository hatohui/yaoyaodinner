import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
	FoodVariantDto,
	PersonDto,
	TableWishDto,
	WishKind,
} from '@/api/model'
import type { NewWish, WishStatus } from '@/hooks/useTableWishes'
import { cn } from '@/utils/shadcn'
import { WishAddForm } from './@WishAddForm'
import { useWishDrop } from './@WishDnd'
import { WishRow } from './@WishRow'

interface WishSectionProps {
	kind: WishKind
	icon: LucideIcon
	title: string
	empty: string
	wishes: TableWishDto[]
	people: PersonDto[]
	statusOf: (wish: TableWishDto) => WishStatus
	canEdit: boolean
	canAddToCart: boolean
	onAdd: (wish: NewWish) => void
	onAddToCart: (wish: TableWishDto) => void
	onSetKind: (id: string, kind: WishKind) => void
	onSetVariant: (id: string, variant: FoodVariantDto) => void
	onSetPeople: (id: string, personIds: string[]) => void
	onRemove: (id: string) => void
}

export function WishSection({
	kind,
	icon: Icon,
	title,
	empty,
	wishes,
	people,
	statusOf,
	canEdit,
	canAddToCart,
	onAdd,
	onAddToCart,
	onSetKind,
	onSetVariant,
	onSetPeople,
	onRemove,
}: WishSectionProps) {
	const { t } = useTranslation()
	const drop = useWishDrop(kind)
	const avoid = kind === 'avoid'
	const done = wishes.filter(w => statusOf(w) === 'ordered').length

	return (
		<section
			ref={drop.ref}
			className={cn(
				'flex h-full flex-col gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors sm:p-4',
				drop.isDragging && 'border-dashed border-primary/40',
				drop.isOver &&
					(avoid
						? 'border-solid border-destructive bg-destructive/10'
						: 'border-solid border-primary bg-primary/10')
			)}
		>
			<header className='flex items-center gap-2'>
				<span
					className={cn(
						'flex size-6 shrink-0 items-center justify-center rounded-lg',
						avoid
							? 'bg-destructive/15 text-destructive'
							: 'bg-primary/15 text-primary'
					)}
				>
					<Icon className='size-3.5' />
				</span>
				<h2 className='text-sm font-semibold text-foreground'>{title}</h2>
				{wishes.length > 0 && !avoid && (
					<span className='ml-auto rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary'>
						{t('plan_board.progress', { done, total: wishes.length })}
					</span>
				)}
			</header>

			{wishes.length === 0 ? (
				<p className='text-xs text-muted-foreground'>
					{drop.isDragging ? t('plan_board.drop_here') : empty}
				</p>
			) : (
				<ul className='flex flex-col divide-y divide-border/60'>
					{wishes.map(wish => (
						<WishRow
							key={wish.id}
							wish={wish}
							people={people}
							status={statusOf(wish)}
							avoid={avoid}
							canEdit={canEdit}
							canAddToCart={canAddToCart}
							onAddToCart={() => onAddToCart(wish)}
							onMove={kind => onSetKind(wish.id, kind)}
							onVariantChange={variant => onSetVariant(wish.id, variant)}
							onPeopleChange={ids => onSetPeople(wish.id, ids)}
							onRemove={() => onRemove(wish.id)}
						/>
					))}
				</ul>
			)}

			{canEdit && (
				<div className='mt-auto pt-1'>
					<WishAddForm
						placeholder={t('plan_board.add_placeholder')}
						onAdd={wish => onAdd({ kind, ...wish } as NewWish)}
					/>
				</div>
			)}
		</section>
	)
}
