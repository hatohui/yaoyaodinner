import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
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
import { cn } from '@/utils/shadcn'
import { bump, burstFlames, startIdleBumps } from '@/utils/fireFx'
import { isOnMap } from '@/components/floor-plan/layout'
import { EditableName } from '@/components/common/EditableName'
import { Roster } from './@Roster'
import { OrdersTab } from './@OrdersTab'
import { SplitsTab } from './@SplitsTab'
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

const tabTrigger =
	'rounded-full text-foreground/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground'

export default function TableDetailPage() {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const backTo: string | undefined = useLocation().state?.backTo
	const { id, table, isLoading, isError, shareLink, updateTable } =
		useTableDetail()
	const { tab, setTab } = useTableTab(id)
	const tourQuery = useIdentityTour(s => s.query)

	useEffect(() => {
		if (tourQuery) setTab('people')
	}, [tourQuery, setTab])

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
	const {
		floorPlan,
		tableCodes,
		menu,
		tableRoast,
		guestRoast,
		isLoading: isConfigLoading,
	} = useConfig()
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
				onRoast: roasts.roastPerson,
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
	const showSplits = orderCount > 0
	const activeTab = tab === 'split' && orders && !showSplits ? 'orders' : tab
	const [joining, setJoining] = useState(false)
	const join = () => setJoining(true)

	if (isLoading || isConfigLoading) {
		return (
			<div className='mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10'>
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
				<Skeleton className='h-10 w-full rounded-full' />
				<RosterSkeleton />
			</div>
		)
	}

	if (isError || !table) {
		return (
			<p className='py-20 text-center text-sm text-muted-foreground'>
				{t('roster.not_found')}
			</p>
		)
	}

	return (
		<div className='mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10'>
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

			<div className='flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
				<div className='flex min-w-0 items-center gap-2'>
					<span
						aria-label={t('roster.table_no', { no: table.no })}
						className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold tabular-nums text-primary-foreground shadow-sm sm:size-9 sm:text-base'
					>
						{table.no}
					</span>
					<h1 className='min-w-0 truncate text-xl font-bold text-foreground sm:text-2xl'>
						{canEdit ? (
							<EditableName
								value={table.name}
								onSave={name => updateTable({ name })}
							/>
						) : (
							table.name
						)}
					</h1>
					<SeatCountChip table={table} />
				</div>
				<div className='flex items-center gap-1.5 sm:shrink-0 sm:gap-2'>
					{tableCodes && canEdit && !isAdmin && <LeaveTableButton />}
					{tableRoast && (
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
									aria-label={t(
										roasts.tableRoast ? 'roast.again' : 'roast.toggle'
									)}
									className={cn(
										'group relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-[background-color,color,border-color] motion-safe:animate-ember disabled:cursor-wait',
										roasts.isRoastingTable
											? 'border-fire bg-gradient-to-r from-fire via-fire-glow to-ember text-fire-foreground shadow-lg shadow-fire/30 ring-2 ring-fire/40 motion-safe:animate-pulse'
											: roasts.tableRoast
												? 'border-fire bg-gradient-to-r from-fire via-fire-glow to-ember text-fire-foreground shadow-md shadow-fire/25 ring-2 ring-fire/30'
												: 'border-fire/50 bg-card text-fire shadow-sm hover:border-fire hover:bg-fire hover:text-fire-foreground'
									)}
								>
									{roasts.isRoastingTable ? (
										<>
											<Flame className='size-4 fill-fire-foreground text-fire-foreground motion-safe:animate-bounce' />
											<span>{t('roast.roasting')}</span>
										</>
									) : (
										<>
											<Flame
												className={cn(
													'size-4 motion-safe:animate-flame',
													roasts.tableRoast
														? 'fill-fire-foreground text-fire-foreground'
														: 'fill-fire/30 text-fire group-hover:fill-fire-foreground/30 group-hover:text-fire-foreground'
												)}
											/>
											<span>
												{t(roasts.tableRoast ? 'roast.again' : 'roast.toggle')}
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
							className='inline-flex items-center gap-1.5 rounded-full border border-border bg-control p-2 text-sm text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:px-3 sm:py-1.5'
						>
							<Map className='size-4' />
							<span className='hidden sm:inline'>{t('floor_plan.view_map')}</span>
						</Link>
					)}
					<button
						type='button'
						onClick={shareLink}
						aria-label={t('roster.copy_link')}
						className='inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-control p-2 text-sm text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:px-3 sm:py-1.5'
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
					onRoast={roasts.roastTable}
					onClear={roasts.clearRoast}
					isClearing={roasts.isClearing}
				/>
			)}

			{showOrdering ? (
				<Tabs value={activeTab} onValueChange={setTab}>
					<TabsList className='h-10 w-full rounded-full border border-border bg-control p-1'>
						<TabsTrigger
							value='people'
							data-tour='people-tab'
							className={tabTrigger}
						>
							{t('tabs.people')}
						</TabsTrigger>
						<TabsTrigger value='orders' className={tabTrigger}>
							{t('tabs.orders')}
							<TabCount count={orderCount} />
						</TabsTrigger>
						{showSplits && (
							<TabsTrigger value='split' className={tabTrigger}>
								{t('tabs.splits')}
							</TabsTrigger>
						)}
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
					<TabsContent value='orders'>
						<OrdersTab table={table} people={people ?? []} canEdit={canEdit} />
					</TabsContent>
					<TabsContent value='split'>
						<SplitsTab table={table} people={people ?? []} canEdit={canEdit} />
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
