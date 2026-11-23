import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import type { PersonDto, TableDto } from '@/api/model'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useOrders } from '@/hooks/useOrders'
import { SplitPickerModal } from '@/components/ordering/SplitPickerModal'
import { OrderListItem } from '@/components/ordering/OrderListItem'
import { TabEmptyState } from './@TabEmptyState'
import { IncludedNoteStrip } from '@/components/common/IncludedNoteStrip'
import { useActivePreset } from './@useActivePreset'
import { PresetMenuSection } from './@PresetMenuSection'
import { PriceDialog } from './@PriceDialog'
import { OrderListSkeleton } from './@Skeletons'
import { OrderRoundSection } from './@OrderRoundSection'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import {
	dishKey,
	groupOrders,
	type OrderedLine,
} from '@/components/ordering/groupOrders'
import { OrderDishGroup } from './@OrderDishGroup'
import { QuickOrderModal, type QuickOrderTarget } from './@QuickOrderModal'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { useHideFree } from '@/hooks/useHideFree'
import { useListView } from '@/components/common/ViewToggle'
import { ORDER_LIST_VIEW_STORAGE_KEY } from '@/common/constants'
import { billingCurrency, hasUnpriced } from '@/utils/money'
import { downloadReceiptImage } from '@/utils/receiptImage'
import { cn } from '@/utils/shadcn'
import { PriceEstimateNote } from '@/components/ordering/PriceEstimateNote'
import { FoodDetailModal } from '@/pages/menu/[id]/@FoodDetailModal'
import { SplitsTab } from './@SplitsTab'
import { OrdersToolbar } from './@OrdersToolbar'
import { OrdersSummaryBar, OrdersSummaryCard } from './@OrdersSummary'
import { useSplitShares } from './@useSplitShares'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'

export type OrdersSubView = 'dishes' | 'people' | 'receipt'

interface OrdersTabProps {
	table: TableDto
	people: PersonDto[]
	canEdit: boolean
	initialSubView?: OrdersSubView
}

/** Lines of the same dish and portion, in first-ordered order. */
const groupByDish = (lines: OrderedLine[]) => {
	const groups = new Map<string, OrderedLine[]>()
	for (const line of lines) {
		const key = dishKey(line)
		groups.set(key, [...(groups.get(key) ?? []), line])
	}
	return [...groups.values()]
}

const linesTotal = (lines: OrderedLine[]) =>
	lines.reduce(
		(sum, o) => (o.shouldCalculate ? sum + o.price * o.quantity : sum),
		0
	)

export function OrdersTab({
	table,
	people,
	canEdit,
	initialSubView,
}: OrdersTabProps) {
	const { t } = useTranslation()
	const {
		orders,
		isLoading,
		total: ordersTotal,
		addOrder,
		isAdding,
		updateLine,
		removeLine,
	} = useOrders(table.id)
	const { stage, canAdd, canSplit, canChangeItems, canEditPrice } =
		useOrderingStage()
	const canOrder = canEdit && canAdd
	const { preset } = useActivePreset(table.eventId)
	const total = ordersTotal + (preset?.price ?? 0)
	const { view, setView } = useListView(ORDER_LIST_VIEW_STORAGE_KEY)
	const isDesktop = useMediaQuery(DESKTOP_QUERY)
	const shares = useSplitShares(table, people)
	const compact = view === 'compact'
	const { hideFree, toggleHideFree } = useHideFree()
	const allLines = useMemo(() => groupOrders(orders), [orders])
	const hasFree = allLines.some(l => !l.shouldCalculate)
	const lines = hideFree ? allLines.filter(l => l.shouldCalculate) : allLines
	const preLines = lines.filter(l => l.round === 'pre')
	const dinnerLines = lines.filter(l => l.round === 'dinner')
	const showRounds =
		dinnerLines.length > 0 || stage === 'dinner' || stage === 'finalized'
	const currency = billingCurrency([...orders, ...(preset?.items ?? [])])
	const { personId: myPersonId } = useWhoAmI(table.id)
	const [editing, setEditing] = useState<OrderedLine | null>(null)
	const [removing, setRemoving] = useState<OrderedLine | null>(null)
	const [pricing, setPricing] = useState<OrderedLine | null>(null)
	const [quickViewId, setQuickViewId] = useState<string | null>(null)
	const [quickAdd, setQuickAdd] = useState<QuickOrderTarget | null>(null)
	const [subView, setSubView] = useState<OrdersSubView>(
		initialSubView ?? 'dishes'
	)

	useEffect(() => {
		if (initialSubView) setSubView(initialSubView)
	}, [initialSubView])

	if (isLoading) {
		return (
			<div className='flex flex-col gap-3'>
				<div className='flex items-center justify-between'>
					<Skeleton className='h-9 w-32 rounded-full bg-primary/15' />
					<Skeleton className='h-8 w-16 rounded-full' />
				</div>
				<OrderListSkeleton />
			</div>
		)
	}

	const renderLine = (line: OrderedLine) => (
		<OrderListItem
			key={line.key}
			order={line}
			people={people}
			onEditSplit={() => setEditing(line)}
			onRemove={() => setRemoving(line)}
			onQuantityChange={quantity => updateLine(line.ids, { quantity })}
			onEditPrice={
				canEdit && canEditPrice(line) ? () => setPricing(line) : undefined
			}
			lockItems={!canEdit || !canChangeItems(line)}
			lockSplit={!canEdit || !canSplit}
		/>
	)

	const renderLines = (group: OrderedLine[]) => (
		<ul
			className={
				compact
					? 'flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-card shadow-sm'
					: 'flex flex-col gap-2'
			}
		>
			{groupByDish(group).map(dish => (
				<OrderDishGroup
					key={dishKey(dish[0])}
					lines={dish}
					people={people}
					currency={currency}
					compact={compact}
					onSelectFood={setQuickViewId}
					onQuickAdd={
						canOrder
							? () =>
									setQuickAdd({
										foodId: dish[0].foodId,
										variantId: dish[0].variantId,
										foodName: dish[0].foodName,
									})
							: undefined
					}
				>
					{dish.map(renderLine)}
				</OrderDishGroup>
			))}
		</ul>
	)

	const showSummary = orders.length > 0
	const hasSidebar = Boolean(preset) || (isDesktop && showSummary)
	const summary = {
		total,
		partial: hasUnpriced(orders),
		currency,
		myShare: shares.mine
			? { amount: shares.mine.total, partial: shares.mine.partial }
			: undefined,
	}
	const summaryProps = {
		summary,
		addOrderHref: canOrder ? `/tables/${table.id}/order` : undefined,
		onShowSplits: () => setSubView('people'),
	}
	const showSubSwitcher =
		orders.length > 0 || Boolean(preset && preset.price > 0)
	const activeSubView = showSubSwitcher ? subView : 'dishes'

	const downloadOrders = () => {
		const splitText = (line: OrderedLine) => {
			if (line.splitAll) return t('orders.shared')
			return (
				line.splits
					.map(
						s =>
							people.find(p => p.id === s.personId)?.name ??
							t('orders.unknown_person')
					)
					.join(', ') || t('orders.personal')
			)
		}
		const slug =
			(table.name || `table-${table.no}`)
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '') || 'orders'
		downloadReceiptImage({
			filename: `${slug}-orders.png`,
			title: `${table.no}. ${table.name || t('roster.table_no', { no: table.no })} · ${t('tabs.orders')}`,
			sections: [
				{
					rows: [
						...(preset && preset.price > 0
							? [
									{
										left: t('orders.set_menu'),
										sub: t('orders.set_menu_shared'),
										right:
											`${preset.price.toFixed(2)} ${billingCurrency(preset.items)}`.trim(),
									},
								]
							: []),
						...groupByDish(lines).map(dish => {
							const head = dish[0]
							const qty = dish.reduce((s, l) => s + l.quantity, 0)
							const amt = dish.reduce(
								(s, l) => (l.shouldCalculate ? s + l.price * l.quantity : s),
								0
							)
							return {
								left: `${qty} × ${head.foodName}${head.variantLabel ? ` · ${head.variantLabel}` : ''}`,
								sub: dish
									.map(l =>
										dish.length > 1
											? `${splitText(l)} ×${l.quantity}`
											: splitText(l)
									)
									.join(', '),
								right: !head.shouldCalculate
									? t('orders.free')
									: amt > 0
										? `${amt.toFixed(2)} ${currency}`
										: t('menu.seasonal_price'),
								muted: !head.shouldCalculate,
							}
						}),
					],
				},
			],
			totalLabel: t('orders.total'),
			totalValue:
				`${hasUnpriced(orders) ? `${t('menu.price_from')} ` : ''}${total.toFixed(2)} ${currency}`.trim(),
			footer: t('orders.estimate_note'),
		})
	}

	return (
		<div
			className={cn(
				'flex flex-col gap-3',
				showSummary && !isDesktop && activeSubView === 'dishes' && 'pb-24'
			)}
		>
			<OrdersToolbar
				isDesktop={isDesktop}
				subView={activeSubView}
				onSubViewChange={showSubSwitcher ? setSubView : undefined}
				showListActions={
					activeSubView === 'dishes' &&
					(orders.length > 0 || Boolean(preset?.items.length))
				}
				hideFree={
					hasFree ? { hidden: hideFree, onToggle: toggleHideFree } : undefined
				}
				onDownload={
					orders.length > 0 || Boolean(preset && preset.price > 0)
						? downloadOrders
						: undefined
				}
				view={view}
				onViewChange={setView}
			/>

			{activeSubView !== 'dishes' ? (
				<SplitsTab
					table={table}
					people={people}
					canEdit={canEdit}
					view={activeSubView}
				/>
			) : (
				<div
					className={
						hasSidebar
							? 'flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-5'
							: 'flex flex-col gap-3'
					}
				>
					{hasSidebar && (
						<aside className='flex flex-col gap-3 lg:order-2 lg:sticky lg:top-20'>
							{isDesktop && showSummary && (
								<OrdersSummaryCard {...summaryProps} />
							)}
							{preset?.note && <IncludedNoteStrip note={preset.note} />}
							{preset && (
								<PresetMenuSection
									preset={preset}
									compact={compact}
									onSelectFood={setQuickViewId}
								/>
							)}
						</aside>
					)}

					<div className='flex min-w-0 flex-col gap-3 lg:order-1'>
						{people.length === 0 ? (
							<p className='rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground'>
								{t('orders.needs_people_body')}
							</p>
						) : (
							orders.length === 0 && (
								<TabEmptyState
									message={t('orders.empty')}
									tableId={table.id}
									canEdit={canOrder}
								/>
							)
						)}

						{orders.length > 0 &&
							(showRounds ? (
								<>
									{preLines.length > 0 && (
										<OrderRoundSection
											title={t('orders.round_pre')}
											locked={stage !== 'open'}
											subtotal={linesTotal(preLines)}
											currency={currency}
											partial={hasUnpriced(preLines)}
										>
											{renderLines(preLines)}
										</OrderRoundSection>
									)}
									<OrderRoundSection
										title={t('orders.round_dinner')}
										locked={stage === 'finalized'}
										subtotal={linesTotal(dinnerLines)}
										currency={currency}
										partial={hasUnpriced(dinnerLines)}
									>
										{dinnerLines.length > 0 ? (
											renderLines(dinnerLines)
										) : (
											<p className='rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
												{t('orders.round_dinner_empty')}
											</p>
										)}
									</OrderRoundSection>
								</>
							) : (
								renderLines(lines)
							))}

						{orders.length > 0 && !isDesktop && <PriceEstimateNote />}
					</div>
				</div>
			)}

			{showSummary && !isDesktop && activeSubView === 'dishes' && (
				<OrdersSummaryBar {...summaryProps} />
			)}

			<SplitPickerModal
				open={editing !== null}
				onOpenChange={open => !open && setEditing(null)}
				people={people}
				initialPersonIds={editing?.splits.map(s => s.personId) ?? []}
				initialSplitAll={editing?.splitAll ?? true}
				myPersonId={myPersonId}
				onConfirm={(splitAll, personIds) => {
					if (editing) updateLine(editing.ids, { splitAll, personIds })
					setEditing(null)
				}}
			/>

			<PriceDialog
				order={pricing}
				onOpenChange={open => !open && setPricing(null)}
				onSave={price => {
					if (pricing) updateLine(pricing.ids, { price })
					setPricing(null)
				}}
			/>

			<ConfirmDialog
				open={removing !== null}
				onOpenChange={open => !open && setRemoving(null)}
				title={t('orders.remove_title', { name: removing?.foodName })}
				description={t('orders.remove_desc')}
				confirmLabel={t('orders.remove')}
				onConfirm={() => {
					if (removing) removeLine(removing.ids)
					setRemoving(null)
				}}
			/>

			<FoodDetailModal
				id={quickViewId}
				onOpenChange={open => !open && setQuickViewId(null)}
			/>

			<QuickOrderModal
				target={quickAdd}
				onOpenChange={open => !open && setQuickAdd(null)}
				people={people}
				myPersonId={myPersonId}
				isSubmitting={isAdding}
				onConfirm={async ({ variantId, quantity, splitAll, personIds }) => {
					await addOrder({
						tableId: table.id,
						variantId,
						quantity,
						splitAll,
						personIds,
					})
					setQuickAdd(null)
				}}
			/>
		</div>
	)
}
