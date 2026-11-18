import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'react-router'
import { ArrowLeft, Flame, Link as LinkIcon, Map } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGetTablePeople } from '@/api/tables/tables'
import { useGetOrders } from '@/api/orders/orders'
import type { OrderResponseDto, PersonDto } from '@/api/model'
import { useIdentityTour } from '@/hooks/useIdentityTour'
import { useTableAccess } from '@/hooks/useTableCode'
import { useTableTab } from '@/hooks/useTableTab'
import { useToast } from '@/hooks/useToast'
import { useConfig } from '@/hooks/useConfig'
import { useRoastVisible } from '@/hooks/useRoastVisible'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { cn } from '@/utils/shadcn'
import { bump, burstFlames, startIdleBumps } from '@/utils/fireFx'
import { isOnMap } from '@/components/floor-plan/layout'
import { EditableName } from '@/components/common/EditableName'
import { Roster } from './@Roster'
import { OrdersTab } from './@OrdersTab'
import { PlanTab } from './@PlanTab'
import { TableBanner } from './@TableBanner'
import { SeatCountChip } from './@SeatCountChip'
import { TableCodeBar } from './@TableCodeBar'
import { TableCodeDialog } from './@TableCodeDialog'
import { groupOrders } from '@/components/ordering/groupOrders'
import { LeaveTableButton } from './@LeaveTableButton'
import { useTableDetail } from './@useTableDetail'
import { RosterSkeleton } from './@Skeletons'
import { TableRoastCard } from './@TableRoastCard'
import { useTableRoast } from './@useTableRoast'
import { useMenuOrderingStore } from '@/pages/menu/@useMenuOrdering'
import { TableAuditDialog } from '@/pages/admin/tables/@TableAuditDialog'

const tabTrigger =
	'rounded-xl text-foreground/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground'

export default function TableDetailPage() {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const backTo: string | undefined = useLocation().state?.backTo
	const { id, table, isLoading, isError, shareLink, updateTable } =
		useTableDetail()
	useEffect(() => {
		if (id) useMenuOrderingStore.getState().pickTable(id)
	}, [id])
	const { tab, setTab } = useTableTab(id)
	const tourQuery = useIdentityTour(s => s.query)

	useEffect(() => {
		if (tourQuery) setTab('people')
	}, [tourQuery, setTab])

	// links such as the order page's "open plan" pick the tab to land on
	const [searchParams] = useSearchParams()
	const tabParam = searchParams.get('tab')
	useEffect(() => {
		if (tabParam) setTab(tabParam)
	}, [tabParam, setTab])

	useEffect(() => {
		if (!table) return
		const label = table.name
			? t('feedback.author_table', { no: table.no, name: table.name })
			: t('roster.table_no', { no: table.no })
		document.title = `${label} · Furum After Gathering`
		return () => {
			document.title = 'Furum After Gathering'
		}
	}, [table, t])
	const { canEdit, canJoin, isAdmin } = useTableAccess(id)
	const { personId: myPersonId } = useWhoAmI(id)
	// AI generations are for guests who claimed a seat here
	const canTriggerAi = Boolean(myPersonId) || isAdmin
	const {
		floorPlan,
		tableCodes,
		menu,
		tableRoast: tableRoastEnabled,
		guestRoast: guestRoastEnabled,
		isLoading: isConfigLoading,
	} = useConfig()
	const roastHidden = useRoastVisible(s => s.hidden)
	const tableRoast = tableRoastEnabled && !roastHidden
	const guestRoast = guestRoastEnabled && !roastHidden
	const roastVisible = useRoastVisible(s => s.visible)
	const showRoast = useRoastVisible(s => s.show)
	const roastButtonRef = useRef<HTMLButtonElement>(null)
	useEffect(
		() => startIdleBumps(roastButtonRef.current),
		[tableRoast, table?.id]
	)
	const canRoast = tableRoast || guestRoast
	const roasts = useTableRoast(id, canRoast)
	const showRoasts = Boolean(
		tableRoast && (roastVisible || roasts.isRoastingTable || roasts.tableRoast)
	)
	const rosterRoast = guestRoast
		? {
				members: roasts.members,
				roastingPersonId: roasts.roastingPersonId,
				onRoast: canTriggerAi ? roasts.roastPerson : undefined,
			}
		: undefined
	const showOrdering = menu || isAdmin
	const showFloorPlan = floorPlan || isAdmin
	const { data: people } = useGetTablePeople<PersonDto[]>(id)
	const { data: orders } = useGetOrders<OrderResponseDto[]>(
		{
			tableId: id,
			lang: i18n.language,
		},
		{
			query: {
				enabled: Boolean(id) && !isConfigLoading && showOrdering,
			},
		}
	)
	const orderCount = useMemo(() => groupOrders(orders ?? []).length, [orders])
	const [joining, setJoining] = useState(false)
	const join = () => setJoining(true)

	if (isLoading || isConfigLoading) {
		return (
			<div className='mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10 lg:max-w-6xl'>
				<Skeleton className='h-4 w-24 rounded-full' />
				<Skeleton className='h-40 w-full rounded-2xl sm:h-52' />
				<div className='flex items-center justify-between gap-2'>
					<div className='flex items-center gap-2'>
						<Skeleton className='h-7 w-48 rounded-full' />
						<Skeleton className='h-6 w-12 rounded-full bg-primary/15' />
					</div>
					<div className='flex gap-2'>
						<Skeleton className='size-9 rounded-full sm:w-28' />
						<Skeleton className='size-9 rounded-full sm:w-28' />
					</div>
				</div>
				<Skeleton className='h-10 w-full rounded-2xl' />
				<RosterSkeleton />
			</div>
		)
	}

	if (isError || !table) {
		return (
			<div className='mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10 lg:max-w-6xl'>
				<Link
					to={backTo ?? '/tables'}
					className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
				>
					<ArrowLeft className='size-4' />
					{backTo ? t('common.back') : t('tables.all_tables')}
				</Link>
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('roster.not_found')}
				</p>
			</div>
		)
	}

	return (
		<div className='mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10 lg:max-w-6xl'>
			<Link
				to={backTo ?? '/tables'}
				className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
			>
				<ArrowLeft className='size-4' />
				{backTo ? t('common.back') : t('tables.all_tables')}
			</Link>

			<TableBanner
				table={table}
				canEdit={canEdit}
				onChange={bannerUrl => updateTable({ bannerUrl })}
			/>

			<div className='flex items-center justify-between gap-2 sm:gap-4'>
				<div className='flex min-w-0 flex-1 items-center gap-2'>
					<span
						aria-label={t('roster.table_no', { no: table.no })}
						className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold tabular-nums text-primary-foreground shadow-sm sm:size-9 sm:text-base'
					>
						{table.no}
					</span>
					<h1 className='flex min-w-0 text-lg font-bold text-foreground sm:text-2xl'>
						{canEdit ? (
							<EditableName
								value={table.name}
								onSave={name => updateTable({ name })}
							/>
						) : (
							<span className='truncate'>{table.name}</span>
						)}
					</h1>
					<SeatCountChip table={table} />
				</div>
				<div className='flex shrink-0 items-center gap-1.5 sm:gap-2'>
					{tableCodes && canEdit && !isAdmin && <LeaveTableButton />}
					{tableRoast &&
						canTriggerAi &&
						!roasts.isLoading &&
						!roasts.tableRoast && (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										ref={roastButtonRef}
										type='button'
										onMouseEnter={() => bump(roastButtonRef.current)}
										onClick={() => {
											bump(roastButtonRef.current, 1.6)
											if (roastButtonRef.current)
												burstFlames(roastButtonRef.current, 8)
											showRoast()
											roasts.roastTable()
										}}
										disabled={roasts.isRoastingTable}
										aria-label={t('roast.toggle')}
										className={cn(
											'group relative inline-flex size-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border text-sm font-medium transition-[background-color,color,border-color] motion-safe:animate-ember disabled:cursor-wait sm:h-9 sm:w-auto sm:px-3',
											roasts.isRoastingTable
												? 'border-fire bg-gradient-to-r from-fire via-fire-glow to-ember text-fire-foreground shadow-lg shadow-fire/30 ring-2 ring-fire/40 motion-safe:animate-pulse'
												: 'border-fire bg-fire text-fire-foreground shadow-sm hover:bg-fire-glow'
										)}
									>
										{roasts.isRoastingTable ? (
											<>
												<Flame className='size-4 fill-fire-foreground text-fire-foreground motion-safe:animate-bounce' />
												<span className='hidden sm:inline'>
													{t('roast.roasting')}
												</span>
											</>
										) : (
											<>
												<Flame className='size-4 fill-fire-foreground/30 text-fire-foreground motion-safe:animate-flame' />
												<span className='hidden sm:inline'>
													{t('roast.toggle')}
												</span>
											</>
										)}
									</button>
								</TooltipTrigger>
								<TooltipContent side='bottom'>
									{t('roast.tooltip')}
								</TooltipContent>
							</Tooltip>
						)}
					{showFloorPlan && isOnMap(table) && (
						<Link
							to={`/tables/map?highlight=${table.id}`}
							aria-label={t('floor_plan.view_map')}
							title={t('floor_plan.view_map')}
							className='inline-flex size-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-auto sm:px-3'
						>
							<Map className='size-4' />
							<span className='hidden sm:inline'>
								{t('floor_plan.view_map')}
							</span>
						</Link>
					)}
					<TableAuditDialog tableId={id} compact />
					<button
						type='button'
						onClick={shareLink}
						aria-label={t('roster.copy_link')}
						title={t('roster.copy_link')}
						className='inline-flex size-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-auto sm:px-3'
					>
						<LinkIcon className='size-4' />
						<span className='hidden sm:inline'>{t('roster.copy_link')}</span>
					</button>
				</div>
			</div>

			{tableCodes && (
				<TableCodeBar
					tableId={id}
					canEdit={canEdit}
					isAdmin={isAdmin}
					onJoin={join}
				/>
			)}

			{showRoasts && (
				<TableRoastCard
					roast={roasts.tableRoast}
					isLoading={roasts.isLoading}
					isRoasting={roasts.isRoastingTable}
					onRoast={canTriggerAi ? roasts.roastTable : undefined}
					onClear={roasts.clearRoast}
					isClearing={roasts.isClearing}
				/>
			)}

			{showOrdering ? (
				<Tabs value={tab} onValueChange={setTab}>
					<TabsList className='sticky top-16 z-20 h-10 w-full rounded-2xl border border-border bg-control/95 p-1 shadow-sm backdrop-blur-md sm:static sm:bg-control sm:shadow-none sm:backdrop-blur-none'>
						<TabsTrigger
							value='people'
							data-tour='people-tab'
							className={tabTrigger}
						>
							{t('tabs.people')}
						</TabsTrigger>
						<TabsTrigger value='plan' className={tabTrigger}>
							{t('tabs.plan')}
						</TabsTrigger>
						<TabsTrigger value='orders' className={tabTrigger}>
							{t('tabs.orders')}
							<TabCount count={orderCount} />
						</TabsTrigger>
					</TabsList>

					<TabsContent value='people'>
						<Roster
							table={table}
							canEdit={canEdit}
							canJoin={canJoin}
							canSetHost={isAdmin}
							onSetHost={personId => updateTable({ tableLeaderId: personId })}
							roast={rosterRoast}
						/>
					</TabsContent>
					<TabsContent value='plan'>
						<PlanTab
							table={table}
							people={people ?? []}
							orders={orders ?? []}
							canEdit={canEdit}
							onJoin={join}
							onShowPeople={() => setTab('people')}
						/>
					</TabsContent>
					<TabsContent value='orders'>
						<OrdersTab
							table={table}
							people={people ?? []}
							canEdit={canEdit}
							initialSubView={tabParam === 'split' ? 'people' : undefined}
						/>
					</TabsContent>
				</Tabs>
			) : (
				<Roster
					table={table}
					canEdit={canEdit}
					canJoin={canJoin}
					canSetHost={isAdmin}
					onSetHost={personId => updateTable({ tableLeaderId: personId })}
					roast={rosterRoast}
				/>
			)}

			<TableCodeDialog
				tableId={id}
				open={joining}
				onOpenChange={setJoining}
				onUnlock={() => {
					setJoining(false)
					toast.success(t('table_code.unlocked'))
				}}
			/>
		</div>
	)
}

function TabCount({ count }: { count: number }) {
	if (count === 0) return null
	return <span className='text-xs tabular-nums opacity-70'>{count}</span>
}
