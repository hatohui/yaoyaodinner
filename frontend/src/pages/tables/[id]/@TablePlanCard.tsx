import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Check,
	ChevronDown,
	RefreshCw,
	RotateCcw,
	Sparkles,
} from 'lucide-react'
import type {
	OrderResponseDto,
	TablePlanItemDto,
	TablePlanItemDtoCourse,
} from '@/api/model'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { cn } from '@/utils/shadcn'
import { PlanRequestDialog } from './@PlanRequestDialog'
import { PlanItemDialog } from './@PlanItemDialog'
import { PlanDishRow } from './@PlanDishRow'
import { PlanRestrictions } from './@PlanRestrictions'
import { PlanRefineBox } from './@PlanRefineBox'
import { PlanModifyDialog } from './@PlanModifyDialog'
import { planChanges } from './@planChanges'
import { useTablePlan, type PlanRequest } from './@useTablePlan'

const COURSE_ORDER: TablePlanItemDtoCourse[] = [
	'main',
	'vegetable',
	'carb',
	'drink',
	'dessert',
	'snack',
]

const totalOf = (items: TablePlanItemDto[]) =>
	items.reduce(
		(sum, i) =>
			i.shouldCalculate && i.price !== null ? sum + i.price * i.quantity : sum,
		0
	)

interface TablePlanCardProps {
	tableId: string
	seatedCount: number
	/** What the table has ordered; once there is something, the AI edits it instead. */
	orders: OrderResponseDto[]
	/** The change-with-AI box, opened from the orders toolbar. */
	modifying: boolean
	onModifyingChange: (open: boolean) => void
}

export function TablePlanCard({
	tableId,
	seatedCount,
	orders,
	modifying,
	onModifyingChange: setModifying,
}: TablePlanCardProps) {
	const { t } = useTranslation()
	const {
		status,
		plan,
		position,
		isLoading,
		isPlanning,
		requestPlan,
		dismissRestriction,
		acceptPlan,
		isAccepting,
	} = useTablePlan(tableId)
	const [asking, setAsking] = useState(false)
	const [confirming, setConfirming] = useState(false)
	const [collapsed, setCollapsed] = useState(false)
	// edits stay on this device until the table accepts the plan
	const [draft, setDraft] = useState<{
		planAt: string
		items: TablePlanItemDto[]
	} | null>(null)
	const [editing, setEditing] = useState<number | null>(null)

	const submit = (request: PlanRequest) => {
		setAsking(false)
		setCollapsed(false)
		requestPlan(request)
	}

	const isModify = plan?.mode === 'modify'
	const startOver = () =>
		orders.length > 0 || isModify ? setModifying(true) : setAsking(true)

	const dialog = (
		<>
			<PlanModifyDialog
				open={modifying}
				onOpenChange={setModifying}
				onSubmit={note => {
					setModifying(false)
					setCollapsed(false)
					requestPlan({
						modify: true,
						note,
						headcount: Math.max(seatedCount, 1),
					})
				}}
			/>
			<PlanRequestDialog
				open={asking}
				onOpenChange={setAsking}
				defaults={{
					headcount: plan?.headcount ?? Math.max(seatedCount, 1),
					budgetPerPerson: plan?.budgetPerPerson ?? null,
					preference: plan?.preference ?? null,
					alcohol: plan?.alcohol ?? true,
				}}
				onSubmit={submit}
			/>
		</>
	)

	if (isLoading) return null

	if (!plan && !isPlanning) {
		// once the table has ordered, editing lives in the orders toolbar instead
		if (orders.length > 0) return dialog
		return (
			<>
				<div className='flex flex-wrap items-center gap-3 rounded-2xl border border-banner-border bg-banner px-4 py-3 shadow-sm'>
					<span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-banner-icon text-banner-icon-foreground'>
						<Sparkles className='size-4' />
					</span>
					<div className='flex min-w-0 flex-1 basis-40 flex-col'>
						<span className='text-sm font-semibold text-banner-foreground'>
							{t('table_plan.cta_title')}
						</span>
						<span className='text-xs text-banner-muted'>
							{t(
								status === 'failed'
									? 'table_plan.failed'
									: 'table_plan.cta_body'
							)}
						</span>
					</div>
					<Button
						className='ml-auto h-9 gap-1.5 rounded-xl bg-action text-action-foreground shadow-md hover:bg-primary hover:text-primary-foreground hover:brightness-100'
						onClick={startOver}
					>
						<Sparkles className='size-4' />
						{t(status === 'failed' ? 'table_plan.retry' : 'table_plan.cta')}
					</Button>
				</div>
				{dialog}
			</>
		)
	}

	const edited = Boolean(plan && draft?.planAt === plan.createdAt)
	const items = plan ? (edited ? draft!.items : plan.items) : []
	const setItems = (next: TablePlanItemDto[]) =>
		plan && setDraft({ planAt: plan.createdAt, items: next })

	const changes = isModify
		? planChanges(items, orders, plan?.baseline ?? [])
		: null

	const accept = async () => {
		setConfirming(false)
		if (await acceptPlan(items, changes)) setDraft(null)
	}

	const refine = (note: string) =>
		requestPlan({
			note,
			current: items.map(i => ({
				variantId: i.variantId,
				quantity: i.quantity,
			})),
		})

	const courses = COURSE_ORDER.map(course => ({
		course,
		entries: items
			.map((item, index) => ({ item, index }))
			.filter(({ item }) => item.course === course),
	})).filter(group => group.entries.length > 0)
	const currency = items.find(i => i.currency)?.currency
	const budgetTotal = plan?.budgetPerPerson
		? plan.budgetPerPerson * plan.headcount
		: null

	return (
		<section
			className={cn(
				'flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm',
				isPlanning ? 'border-primary' : 'border-border'
			)}
		>
			<div className='flex items-center justify-between gap-2'>
				<button
					type='button'
					onClick={() => setCollapsed(c => !c)}
					aria-expanded={!collapsed}
					className='flex min-w-0 cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary transition-opacity hover:opacity-80'
				>
					<Sparkles className='size-4 shrink-0' />
					<span className='truncate'>
						{isPlanning
							? t('table_plan.planning')
							: (plan?.title ?? t('table_plan.title'))}
					</span>
					<ChevronDown
						className={cn(
							'size-4 shrink-0 transition-transform duration-200',
							collapsed ? '-rotate-90' : 'rotate-0'
						)}
					/>
				</button>
				{plan && (
					<Button
						variant='ghost'
						size='sm'
						className='h-7 shrink-0 gap-1.5 rounded-full text-xs text-primary hover:bg-primary/10 hover:text-primary'
						disabled={isPlanning}
						onClick={startOver}
					>
						{isPlanning ? (
							<Spinner className='size-3.5' />
						) : (
							<RefreshCw className='size-3.5' />
						)}
						{t('table_plan.again')}
					</Button>
				)}
			</div>

			{!collapsed && (
				<>
					{isPlanning && (
						<p className='text-sm text-foreground'>
							{position
								? t('table_plan.queued', { count: position })
								: t('table_plan.planning_body')}
						</p>
					)}

					{plan && !isPlanning && (
						<>
							<p className='text-sm text-foreground'>{plan.intro}</p>
							<p className='text-xs font-medium text-muted-foreground'>
								{t('table_plan.for_people', { count: plan.headcount })} ·{' '}
								{t('table_plan.tap_to_edit')}
							</p>

							<div className='flex flex-col gap-3'>
								{courses.map(({ course, entries }) => (
									<div key={course} className='flex flex-col gap-0.5'>
										<p className='px-2 text-xs font-semibold uppercase tracking-wide text-primary'>
											{t(`table_plan.course_${course}`)}
										</p>
										<ul className='flex flex-col'>
											{entries.map(({ item, index }) => (
												<PlanDishRow
													key={item.variantId}
													item={item}
													change={changes?.deltas.get(item.variantId)}
													onSelect={() => setEditing(index)}
												/>
											))}
										</ul>
									</div>
								))}
								{changes && changes.removed.length > 0 && (
									<div className='flex flex-col gap-0.5'>
										<p className='px-2 text-xs font-semibold uppercase tracking-wide text-destructive'>
											{t('table_plan.removing')}
										</p>
										<ul className='flex flex-col'>
											{changes.removed.map(dish => (
												<li
													key={dish.variantId}
													className='flex items-center gap-3 p-2 opacity-60'
												>
													<OrderThumb
														imageKey={dish.imageUrl}
														alt={dish.name}
														className='size-12 grayscale'
													/>
													<p className='min-w-0 flex-1 text-sm text-foreground line-through'>
														<span className='tabular-nums'>
															{dish.quantity}×
														</span>{' '}
														{dish.name}
														{dish.label && (
															<span className='text-muted-foreground'>
																{' '}
																· {dish.label}
															</span>
														)}
													</p>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>

							<div className='flex flex-col gap-0.5 border-t border-border pt-3'>
								<div className='flex items-center justify-between text-sm font-semibold text-foreground'>
									<span>{t('table_plan.estimated_total')}</span>
									<TotalAmount
										amount={totalOf(items)}
										currency={currency}
										partial={items.some(
											i => i.shouldCalculate && i.price === null
										)}
									/>
								</div>
								<p className='text-xs text-muted-foreground'>
									{isModify
										? t('table_plan.modify_total')
										: budgetTotal !== null
											? t('table_plan.budget_line', {
													amount:
														`${budgetTotal.toFixed(2)} ${currency ?? ''}`.trim(),
													count: plan.headcount,
												})
											: t('table_plan.on_top_of_set_menu')}
								</p>
							</div>

							<PlanRestrictions
								restrictions={plan.restrictions}
								canDismiss
								disabled={isPlanning}
								onDismiss={dismissRestriction}
							/>

							<PlanRefineBox
								disabled={isPlanning || isAccepting}
								onRefine={refine}
							/>

							<div className='flex flex-wrap items-center gap-2'>
								<Button
									className='h-9 gap-1.5 rounded-xl bg-action text-action-foreground shadow-md hover:bg-primary hover:text-primary-foreground hover:brightness-100'
									onClick={() => setConfirming(true)}
									disabled={
										(changes ? changes.count === 0 : items.length === 0) ||
										isPlanning ||
										isAccepting
									}
								>
									{isAccepting ? (
										<Spinner className='size-4' />
									) : (
										<Check className='size-4' />
									)}
									{t(changes ? 'table_plan.apply' : 'table_plan.accept')}
								</Button>
								{changes?.stale && (
									<p className='w-full text-xs text-muted-foreground'>
										{t('table_plan.modify_stale')}
									</p>
								)}
								{changes?.count === 0 && (
									<p className='text-xs text-muted-foreground'>
										{t('table_plan.no_changes')}
									</p>
								)}
								{edited && (
									<Button
										variant='ghost'
										size='sm'
										className='gap-1.5 rounded-full text-muted-foreground'
										onClick={() => setDraft(null)}
									>
										<RotateCcw className='size-3.5' />
										{t('table_plan.reset_edits')}
									</Button>
								)}
							</div>

							{plan.isStale && (
								<p className='text-xs text-muted-foreground'>
									{t('table_plan.stale')}
								</p>
							)}
							<p className='text-xs text-muted-foreground'>
								{t('table_plan.disclaimer')}
							</p>
						</>
					)}
				</>
			)}
			{dialog}
			<ConfirmDialog
				open={confirming}
				onOpenChange={setConfirming}
				title={
					changes
						? t('table_plan.apply_confirm_title', { count: changes.count })
						: t('table_plan.accept_confirm_title', { count: items.length })
				}
				description={t(
					changes
						? 'table_plan.apply_confirm_body'
						: 'table_plan.accept_confirm_body'
				)}
				confirmLabel={t(
					changes ? 'table_plan.apply_confirm' : 'table_plan.accept_confirm'
				)}
				destructive={false}
				onConfirm={accept}
			/>
			<PlanItemDialog
				item={editing === null ? null : (items[editing] ?? null)}
				onOpenChange={open => !open && setEditing(null)}
				onSave={updated => {
					setItems(items.map((item, i) => (i === editing ? updated : item)))
					setEditing(null)
				}}
				onRemove={() => {
					setItems(items.filter((_, i) => i !== editing))
					setEditing(null)
				}}
			/>
		</section>
	)
}
