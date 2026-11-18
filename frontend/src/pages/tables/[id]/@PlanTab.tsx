import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, ClipboardCopy, Sparkles, Star, Wand2, Zap } from 'lucide-react'
import type { OrderResponseDto, PersonDto, TableDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplyPlanDialog } from '@/components/ordering/ApplyPlanDialog'
import { AllergyDialog } from './@AllergyDialog'
import { AllergySection } from './@AllergySection'
import { PersonalOrdersSection } from './@PersonalOrdersSection'
import { PlanAccessHint } from './@PlanAccessHint'
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
		canAddToCart: board.canAddToCart,
		onAdd: board.add,
		onAddToCart: board.addToCart,
		onSetKind: board.setKind,
		onSetVariant: board.setVariant,
		onSetPeople: board.setPeople,
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

			<div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2'>
				<p className='text-xs text-muted-foreground'>
					{canEdit ? t('plan_board.intro_drag') : t('plan_board.intro')}
				</p>
				<div className='flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:justify-end'>
					{board.canUseAi && orders.length > 0 && !plan && !isPlanning && (
						<Button
							variant='outline'
							size='sm'
							onClick={() => setModifying(true)}
							className='relative shrink-0 gap-1.5 overflow-hidden rounded-full border-2 border-dashed border-ai/70 bg-ai-muted font-semibold text-ai shadow-sm hover:border-solid hover:border-ai hover:bg-ai-muted hover:text-ai'
						>
							<Wand2 className='size-4 motion-safe:animate-ai-twinkle' />
							{t('table_plan.modify_cta')}
						</Button>
					)}
					{board.canAddToCart && board.pendingCount > 0 && (
						<Button
							size='sm'
							onClick={() => setPreviewing(true)}
							className='shrink-0 gap-1.5 rounded-full'
						>
							<Zap className='size-4' />
							{t('plan_board.apply_plan', { count: board.pendingCount })}
						</Button>
					)}
					<Button
						variant='outline'
						size='sm'
						disabled={board.isEmpty}
						onClick={board.copy}
						className='shrink-0 gap-1.5 rounded-full'
					>
						<ClipboardCopy className='size-4' />
						{t('plan_board.copy')}
					</Button>
				</div>
			</div>

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

			<ApplyPlanDialog
				open={previewing}
				onOpenChange={setPreviewing}
				wishes={board.wishes}
				people={people}
				statusOf={board.statusOf}
				onConfirm={board.applyPlan}
			/>
			<AllergyDialog
				person={board.editing}
				isSaving={board.isSavingAllergies}
				onOpenChange={open => !open && board.setEditing(null)}
				onSave={board.saveAllergies}
			/>
		</div>
	)
}
