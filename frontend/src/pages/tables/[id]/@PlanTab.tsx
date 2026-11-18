import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Ban,
	ClipboardCopy,
	Download,
	Sparkles,
	Star,
	Wand2,
	Zap,
} from 'lucide-react'
import type { OrderResponseDto, PersonDto, TableDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
	useListView,
	ViewToggle,
	type ListView,
} from '@/components/common/ViewToggle'
import { PLAN_VIEW_STORAGE_KEY } from '@/common/constants'
import { ApplyPlanDialog } from '@/components/ordering/ApplyPlanDialog'
import { FoodDetailModal } from '@/pages/menu/[id]/@FoodDetailModal'
import { AllergyDialog } from './@AllergyDialog'
import { AllergySection } from './@AllergySection'
import { PersonalOrdersSection } from './@PersonalOrdersSection'
import { PlanAccessHint } from './@PlanAccessHint'
import { PlanSummaryView } from './@PlanSummaryView'
import { TablePlanCard } from './@TablePlanCard'
import { useTablePlan } from './@useTablePlan'
import { WishDnd } from './@WishDnd'
import { WishSection } from './@WishSection'
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
			<div className='flex flex-col gap-3 pt-2'>
				<Skeleton className='h-28 w-full rounded-2xl' />
				<Skeleton className='h-28 w-full rounded-2xl' />
			</div>
		)
	}

	const wishProps = {
		people,
		statusOf: board.statusOf,
		canEdit,
		onAdd: board.add,
		onSelectFood: setQuickViewId,
		onSetKind: board.setKind,
		onSetVariant: board.setVariant,
		onSetPeople: board.setPeople,
		onSetQuantity: board.setQuantity,
		onRemove: board.remove,
	}

	return (
		<div className='flex flex-col gap-3 pt-2'>
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
				<div className='flex flex-wrap items-center gap-1.5 sm:gap-2'>
					{board.canAddToCart && board.pendingCount > 0 && (
						<Button
							size='sm'
							onClick={() => setPreviewing(true)}
							className='shrink-0 gap-1.5 rounded-xl px-2.5 text-xs sm:px-3 sm:text-sm'
						>
							<Zap className='size-4' />
							{t('plan_board.apply_plan', { count: board.pendingCount })}
						</Button>
					)}
					{board.canUseAi && orders.length > 0 && !plan && !isPlanning && (
						<Button
							variant='outline'
							size='sm'
							onClick={() => setModifying(true)}
							aria-label={t('table_plan.modify_cta')}
							title={t('table_plan.modify_cta')}
							className='relative shrink-0 gap-1.5 overflow-hidden rounded-xl border-2 border-dashed border-ai/70 bg-ai-muted px-2.5 text-xs font-semibold text-ai shadow-sm before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1/3 before:bg-gradient-to-r before:from-transparent before:via-ai/25 before:to-transparent hover:border-solid hover:border-ai hover:bg-ai-muted hover:text-ai dark:border-ai/70 dark:bg-ai-muted dark:hover:border-ai dark:hover:bg-ai-muted sm:px-3 sm:text-sm motion-safe:before:animate-ai-sheen'
						>
							<Wand2 className='size-4 motion-safe:animate-ai-twinkle' />
							<span className='sm:hidden'>
								{t('table_plan.modify_cta_short')}
							</span>
							<span className='hidden sm:inline'>
								{t('table_plan.modify_cta')}
							</span>
						</Button>
					)}
					<div className='ml-auto flex shrink-0 items-center gap-1.5'>
						<Button
							variant='outline'
							size='icon-sm'
							disabled={board.isEmpty}
							onClick={() => board.download(table)}
							aria-label={t('common.download_image')}
							title={t('common.download_image')}
							className='rounded-xl'
						>
							<Download className='size-3.5' />
						</Button>
						<Button
							variant='outline'
							size='sm'
							disabled={board.isEmpty}
							onClick={board.copy}
							aria-label={t('plan_board.copy')}
							title={t('plan_board.copy')}
							className='size-8 shrink-0 gap-1.5 rounded-xl p-0 sm:w-auto sm:px-3'
						>
							<ClipboardCopy className='size-3.5 sm:size-4' />
							<span className='hidden sm:inline'>{t('plan_board.copy')}</span>
						</Button>
						<ViewToggle view={view} onChange={setView} />
					</div>
				</div>
				{canEdit && view === 'card' && (
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
					<div className='grid grid-cols-1 gap-3 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-5'>
						<div className='flex min-w-0 flex-col gap-3'>
							<WishSection
								kind='must'
								icon={Star}
								title={t('plan_board.must')}
								empty={t('plan_board.must_empty')}
								wishes={board.must}
								{...wishProps}
							/>
							<WishSection
								kind='want'
								icon={Sparkles}
								title={t('plan_board.want')}
								empty={t('plan_board.want_empty')}
								wishes={board.want}
								{...wishProps}
							/>
							<PersonalOrdersSection
								tableId={table.id}
								dishes={board.dishes}
								canAdd={board.canAddToCart}
								onSelectFood={setQuickViewId}
							/>
						</div>
						<div className='flex min-w-0 flex-col gap-3'>
							<WishSection
								kind='avoid'
								icon={Ban}
								title={t('plan_board.avoid')}
								empty={t('plan_board.avoid_empty')}
								wishes={board.avoid}
								{...wishProps}
							/>
							<AllergySection
								groups={board.allergies}
								people={people}
								canEdit={canEdit}
								labelOf={board.labelOf}
								onEditPerson={board.setEditing}
							/>
						</div>
					</div>
				</WishDnd>
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
