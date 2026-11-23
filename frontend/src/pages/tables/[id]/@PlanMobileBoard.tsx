import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, ChevronRight, ShieldAlert, Sparkles, Star } from 'lucide-react'
import type { PersonDto, TableWishDto } from '@/api/model'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import type { NewWish } from '@/hooks/useTableWishes'
import { cn } from '@/utils/shadcn'
import { AllergySection } from './@AllergySection'
import { PersonalOrdersSection } from './@PersonalOrdersSection'
import { PlanAddBar } from './@PlanAddBar'
import { PlanQuickPicks } from './@PlanQuickPicks'
import type { AllergyGroup, PersonalDish } from './@planBoard'
import { WishSection, type WishHandlers } from './@WishSection'

type Bucket = 'must' | 'want' | 'mine'

interface PlanMobileBoardProps {
	tableId: string
	people: PersonDto[]
	canEdit: boolean
	canAddToCart: boolean
	must: TableWishDto[]
	want: TableWishDto[]
	avoid: TableWishDto[]
	dishes: PersonalDish[]
	allergies: AllergyGroup[]
	labelOf: (group: Pick<AllergyGroup, 'allergen' | 'label'>) => string
	onEditPerson: (person: PersonDto) => void
	plannedFoodIds: Set<string>
	onAdd: (wish: NewWish) => void
	onSelectFood: (foodId: string) => void
	handlers: WishHandlers
}

export function PlanMobileBoard({
	tableId,
	people,
	canEdit,
	canAddToCart,
	must,
	want,
	avoid,
	dishes,
	allergies,
	labelOf,
	onEditPerson,
	plannedFoodIds,
	onAdd,
	onSelectFood,
	handlers,
}: PlanMobileBoardProps) {
	const { t } = useTranslation()
	const [bucket, setBucket] = useState<Bucket>('must')
	const [keepOffOpen, setKeepOffOpen] = useState(false)
	const keepOffCount = avoid.length + allergies.length
	const keepOffNames = [...allergies.map(labelOf), ...avoid.map(w => w.name)]

	const buckets = [
		{ value: 'must', label: t('plan_board.must'), count: must.length },
		{ value: 'want', label: t('plan_board.want'), count: want.length },
		{ value: 'mine', label: t('plan_board.mine'), count: dishes.length },
	] as const

	return (
		<div className='flex flex-col gap-3'>
			<button
				type='button'
				onClick={() => setKeepOffOpen(true)}
				className={cn(
					'flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors',
					keepOffCount > 0
						? 'border-destructive/40 bg-destructive/10'
						: 'border-border bg-card'
				)}
			>
				<ShieldAlert className='size-4 shrink-0 text-destructive' />
				<span className='flex min-w-0 flex-1 flex-col'>
					<span className='text-sm font-semibold text-foreground'>
						{t('plan_board.keep_off')}
					</span>
					<span className='truncate text-xs text-muted-foreground'>
						{keepOffNames.length > 0
							? keepOffNames.join(', ')
							: t('plan_board.keep_off_empty')}
					</span>
				</span>
				{keepOffCount > 0 && (
					<span className='rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-destructive'>
						{keepOffCount}
					</span>
				)}
				<ChevronRight className='size-4 shrink-0 text-muted-foreground' />
			</button>

			<div
				role='tablist'
				className='grid grid-cols-3 gap-1 rounded-2xl border border-border bg-control p-1'
			>
				{buckets.map(({ value, label, count }) => (
					<button
						key={value}
						type='button'
						role='tab'
						aria-selected={bucket === value}
						onClick={() => setBucket(value)}
						className={cn(
							'flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-colors',
							bucket === value
								? 'bg-primary text-primary-foreground'
								: 'text-foreground/70'
						)}
					>
						<span className='truncate'>{label}</span>
						{count > 0 && (
							<span className='tabular-nums opacity-70'>{count}</span>
						)}
					</button>
				))}
			</div>

			{canEdit && bucket !== 'mine' && (
				<PlanAddBar
					kind={bucket}
					plannedFoodIds={plannedFoodIds}
					onAdd={onAdd}
				/>
			)}
			{canEdit &&
				((bucket === 'must' && must.length === 0) ||
					(bucket === 'want' && want.length === 0)) && (
					<PlanQuickPicks
						kind={bucket}
						plannedFoodIds={plannedFoodIds}
						onAdd={onAdd}
					/>
				)}

			{bucket === 'must' && (
				<WishSection
					kind='must'
					icon={Star}
					title={t('plan_board.must')}
					empty={t('plan_board.must_empty')}
					wishes={must}
					{...handlers}
				/>
			)}
			{bucket === 'want' && (
				<WishSection
					kind='want'
					icon={Sparkles}
					title={t('plan_board.want')}
					empty={t('plan_board.want_empty')}
					wishes={want}
					{...handlers}
				/>
			)}
			{bucket === 'mine' && (
				<PersonalOrdersSection
					tableId={tableId}
					dishes={dishes}
					canAdd={canAddToCart}
					onSelectFood={onSelectFood}
				/>
			)}

			<Sheet open={keepOffOpen} onOpenChange={setKeepOffOpen}>
				<SheetContent
					side='bottom'
					className='scrollbar-thin max-h-[85vh] overflow-y-auto rounded-t-3xl'
				>
					<SheetHeader>
						<SheetTitle>{t('plan_board.keep_off')}</SheetTitle>
						<SheetDescription>{t('plan_board.keep_off_body')}</SheetDescription>
					</SheetHeader>
					<div className='flex flex-col gap-3 px-4 pb-6'>
						{canEdit && (
							<PlanAddBar
								kind='avoid'
								plannedFoodIds={plannedFoodIds}
								onAdd={onAdd}
							/>
						)}
						<WishSection
							kind='avoid'
							icon={Ban}
							title={t('plan_board.avoid')}
							empty={t('plan_board.avoid_empty')}
							wishes={avoid}
							{...handlers}
						/>
						<AllergySection
							groups={allergies}
							people={people}
							canEdit={canEdit}
							labelOf={labelOf}
							onEditPerson={person => {
								setKeepOffOpen(false)
								onEditPerson(person)
							}}
						/>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	)
}
