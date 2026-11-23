import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, Sparkles, Star } from 'lucide-react'
import type { PersonDto, TableWishDto, WishKind } from '@/api/model'
import type { NewWish } from '@/hooks/useTableWishes'
import { AllergySection } from './@AllergySection'
import { PersonalOrdersSection } from './@PersonalOrdersSection'
import { PlanAddBar } from './@PlanAddBar'
import { PlanQuickPicks } from './@PlanQuickPicks'
import type { AllergyGroup, PersonalDish } from './@planBoard'
import { WishSection, type WishHandlers } from './@WishSection'

interface PlanDesktopBoardProps {
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
	readyCard: ReactNode
}

export function PlanDesktopBoard({
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
	readyCard,
}: PlanDesktopBoardProps) {
	const { t } = useTranslation()
	const [kind, setKind] = useState<WishKind>('must')

	return (
		<div className='flex flex-col gap-3'>
			{canEdit && (
				<PlanAddBar
					kind={kind}
					plannedFoodIds={plannedFoodIds}
					onKindChange={setKind}
					onAdd={onAdd}
				/>
			)}
			{canEdit && kind !== 'avoid' && must.length + want.length === 0 && (
				<PlanQuickPicks
					kind={kind}
					plannedFoodIds={plannedFoodIds}
					onAdd={onAdd}
				/>
			)}
			<div className='grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5'>
				<div className='flex min-w-0 flex-col gap-3'>
					<div className='flex flex-col gap-3'>
						<WishSection
							kind='must'
							icon={Star}
							title={t('plan_board.must')}
							empty={t('plan_board.must_empty')}
							wishes={must}
							{...handlers}
						/>
						<WishSection
							kind='want'
							icon={Sparkles}
							title={t('plan_board.want')}
							empty={t('plan_board.want_empty')}
							wishes={want}
							{...handlers}
						/>
					</div>
					<PersonalOrdersSection
						tableId={tableId}
						dishes={dishes}
						canAdd={canAddToCart}
						onSelectFood={onSelectFood}
					/>
				</div>
				<aside className='sticky top-20 flex min-w-0 flex-col gap-3'>
					{readyCard}
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
						onEditPerson={onEditPerson}
					/>
				</aside>
			</div>
		</div>
	)
}
