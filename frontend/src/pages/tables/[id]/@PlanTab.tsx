import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OrderResponseDto, PersonDto, TableDto } from '@/api/model'
import { Skeleton } from '@/components/ui/skeleton'
import { useListView, type ListView } from '@/components/common/ViewToggle'
import { PLAN_VIEW_STORAGE_KEY } from '@/common/constants'
import { ApplyPlanDialog } from '@/components/ordering/ApplyPlanDialog'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { FoodDetailModal } from '@/pages/menu/[id]/@FoodDetailModal'
import { cn } from '@/utils/shadcn'
import { AllergyDialog } from './@AllergyDialog'
import { PlanAccessHint } from './@PlanAccessHint'
import { PlanApplyBar } from './@PlanApplyBar'
import { PlanDesktopBoard } from './@PlanDesktopBoard'
import { PlanMobileBoard } from './@PlanMobileBoard'
import { PlanReadyCard } from './@PlanReadyCard'
import { PlanSummaryView } from './@PlanSummaryView'
import { PlanToolbar } from './@PlanToolbar'
import { TablePlanCard } from './@TablePlanCard'
import { useTablePlan } from './@useTablePlan'
import { WishDnd } from './@WishDnd'
import { usePlanBoard } from './@usePlanBoard'

interface PlanTabProps {
	table: TableDto
	people: PersonDto[]
	orders: OrderResponseDto[]
	canEdit: boolean
	onJoin: () => void
	onShowPeople: () => void
}

export function PlanTab({
	table,
	people,
	orders,
	canEdit,
	onJoin,
	onShowPeople,
}: PlanTabProps) {
	const { t } = useTranslation()
	const board = usePlanBoard(table.id, people, orders, canEdit)
	const isDesktop = useMediaQuery(DESKTOP_QUERY)
	const { plan, isPlanning } = useTablePlan(table.id)
	const [modifying, setModifying] = useState(false)
	const [previewing, setPreviewing] = useState(false)
	const [quickViewId, setQuickViewId] = useState<string | null>(null)
	const { view: savedView, setView: setSavedView } = useListView(
		PLAN_VIEW_STORAGE_KEY
	)
	const [guestView, setGuestView] = useState<ListView>('compact')
	const view = canEdit ? savedView : guestView
	const setView = canEdit ? setSavedView : setGuestView

	if (board.isLoading) {
		return (
			<div className='flex flex-col gap-3'>
				<Skeleton className='h-28 w-full rounded-2xl' />
				<Skeleton className='h-28 w-full rounded-2xl' />
			</div>
		)
	}

	const handlers = {
		people,
		statusOf: board.statusOf,
		canEdit,
		onSelectFood: setQuickViewId,
		onSetKind: board.setKind,
		onSetVariant: board.setVariant,
		onSetPeople: board.setPeople,
		onSetQuantity: board.setQuantity,
		onRemove: board.remove,
	}
	const boardProps = {
		tableId: table.id,
		people,
		canEdit,
		canAddToCart: board.canAddToCart,
		must: board.must,
		want: board.want,
		avoid: board.avoid,
		dishes: board.dishes,
		allergies: board.allergies,
		labelOf: board.labelOf,
		onEditPerson: board.setEditing,
		plannedFoodIds: new Set(
			board.wishes.flatMap(w => (w.foodId ? [w.foodId] : []))
		),
		onAdd: board.add,
		onSelectFood: setQuickViewId,
		handlers,
	}
	const canApply = board.canAddToCart && board.pendingCount > 0
	const apply = () => setPreviewing(true)
	const showReadyCard = isDesktop && view === 'card'

	return (
		<div
			className={cn('flex flex-col gap-3', canApply && !isDesktop && 'pb-24')}
		>
			<PlanAccessHint
				access={board.access}
				onJoin={onJoin}
				onShowPeople={onShowPeople}
			/>
			{board.canUseAi && (
				<TablePlanCard
					tableId={table.id}
					seatedCount={people.length}
					orders={orders}
					modifying={modifying}
					onModifyingChange={setModifying}
				/>
			)}

			<div className='flex flex-col gap-2'>
				<PlanToolbar
					isDesktop={isDesktop}
					applyCount={board.pendingCount}
					onApply={canApply && isDesktop && !showReadyCard ? apply : undefined}
					onModify={
						board.canUseAi && orders.length > 0 && !plan && !isPlanning
							? () => setModifying(true)
							: undefined
					}
					isEmpty={board.isEmpty}
					onDownload={() => board.download(table)}
					onCopy={board.copy}
					view={view}
					onViewChange={setView}
				/>
				{canEdit && isDesktop && view === 'card' && (
					<p className='text-xs text-muted-foreground'>
						{t('plan_board.intro_drag')}
					</p>
				)}
			</div>

			{view === 'compact' ? (
				<PlanSummaryView
					must={board.must}
					want={board.want}
					avoid={board.avoid}
					dishes={board.dishes}
					allergies={board.allergies}
					people={people}
					statusOf={board.statusOf}
					labelOf={board.labelOf}
					onSelectFood={setQuickViewId}
				/>
			) : (
				<WishDnd wishes={board.wishes} onMove={board.moveWish}>
					{isDesktop ? (
						<PlanDesktopBoard
							{...boardProps}
							readyCard={
								canApply && (
									<PlanReadyCard
										pending={board.pending}
										count={board.pendingCount}
										headcount={people.length}
										onApply={apply}
									/>
								)
							}
						/>
					) : (
						<PlanMobileBoard {...boardProps} />
					)}
				</WishDnd>
			)}

			{canApply && !isDesktop && (
				<PlanApplyBar
					pending={board.pending}
					count={board.pendingCount}
					headcount={people.length}
					onApply={apply}
				/>
			)}

			<ApplyPlanDialog
				open={previewing}
				onOpenChange={setPreviewing}
				wishes={board.wishes}
				cartLines={board.cart.lines}
				myPersonId={board.cart.myPersonId}
				people={people}
				statusOf={board.statusOf}
				isSubmitting={board.cart.isPlacing}
				onConfirm={board.applyPlan}
			/>
			<AllergyDialog
				person={board.editing}
				isSaving={board.isSavingAllergies}
				onOpenChange={open => !open && board.setEditing(null)}
				onSave={board.saveAllergies}
			/>
			<FoodDetailModal
				id={quickViewId}
				onOpenChange={open => !open && setQuickViewId(null)}
				planOnly
			/>
		</div>
	)
}
