import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowRight, Flame, Coins, TriangleAlert } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PinCard } from './@PinCard'
import { EventStatsCards } from './@EventStatsCards'
import { PublishEventDialog } from './@PublishEventDialog'
import { PastEventsList } from './@PastEventsList'
import { EventSettingsCard } from './@EventSettingsCard'
import { ExportOrdersDialog } from './@ExportOrdersDialog'
import { useAdminDashboard } from './@useAdminDashboard'

export default function AdminDashboardPage() {
	const { t } = useTranslation()
	const {
		activeEvent,
		selectedEvent,
		selectEvent,
		activeLoading,
		pastEvents,
		pastLoading,
		popular,
		tableTotals,
		totalSpend,
		avgPerTable,
		publish,
		publishing,
		copyPin,
	} = useAdminDashboard()

	const topTables = [...tableTotals]
		.sort((a, b) => b.total - a.total)
		.slice(0, 5)
	const maxPopular = Math.max(...popular.map(i => i.count), 1)
	const maxTableSpend = Math.max(...topTables.map(r => r.total), 1)

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.dashboard.title')}
				</h1>
				<div className='flex flex-wrap items-center gap-2'>
					{selectedEvent && (
						<ExportOrdersDialog
							eventName={
								selectedEvent.name || t('admin.dashboard.unnamed_event')
							}
						/>
					)}
					<PublishEventDialog
						hasActiveEvent={Boolean(activeEvent)}
						pending={publishing}
						onPublish={name => publish(name ? { name } : {})}
					/>
				</div>
			</div>

			{activeLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : selectedEvent ? (
				<>
					<EventStatsCards
						stats={selectedEvent.stats}
						totalSpend={totalSpend}
						avgPerTable={avgPerTable}
					/>

					<div className='grid items-start gap-4 lg:grid-cols-2'>
						<div className='flex flex-col gap-4'>
							<PinCard
								pin={selectedEvent.pin}
								name={selectedEvent.name}
								onCopy={() => copyPin(selectedEvent.pin)}
							/>
							<EventSettingsCard />
						</div>

						<div className='flex flex-col gap-4'>
							<Card className='gap-3 rounded-2xl p-4'>
								<div className='flex items-center justify-between gap-2'>
									<div className='flex items-center gap-2'>
										<Flame className='size-4 text-primary' />
										<p className='text-sm font-semibold text-foreground'>
											{t('admin.stats.popular_title')}
										</p>
									</div>
									<Link
										to='/admin/stats'
										className='flex items-center gap-1 text-xs font-medium text-primary hover:underline'
									>
										{t('admin.stats.title')}
										<ArrowRight className='size-3.5' />
									</Link>
								</div>
								{popular.length === 0 ? (
									<p className='py-4 text-center text-xs text-muted-foreground'>
										{t('admin.stats.popular_empty')}
									</p>
								) : (
									<ul className='flex flex-col gap-2'>
										{popular.map((item, idx) => (
											<li
												key={item.variantId}
												className='flex flex-col gap-1 text-xs'
											>
												<div className='flex items-center justify-between gap-2'>
													<span className='truncate font-medium text-foreground'>
														{idx + 1}. {item.name}
													</span>
													<span className='shrink-0 tabular-nums text-muted-foreground'>
														{item.count}
													</span>
												</div>
												<span className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
													<span
														className='block h-full rounded-full bg-primary'
														style={{
															width: `${(item.count / maxPopular) * 100}%`,
														}}
													/>
												</span>
											</li>
										))}
									</ul>
								)}
							</Card>

							<Card className='gap-3 rounded-2xl p-4'>
								<div className='flex items-center justify-between gap-2'>
									<div className='flex items-center gap-2'>
										<Coins className='size-4 text-primary' />
										<p className='text-sm font-semibold text-foreground'>
											{t('admin.stats.totals_title')}
										</p>
									</div>
									<Link
										to='/admin/tables'
										className='flex items-center gap-1 text-xs font-medium text-primary hover:underline'
									>
										{t('admin.tables.title')}
										<ArrowRight className='size-3.5' />
									</Link>
								</div>
								{topTables.length === 0 ? (
									<p className='py-4 text-center text-xs text-muted-foreground'>
										{t('admin.stats.totals_empty')}
									</p>
								) : (
									<ul className='flex flex-col gap-2'>
										{topTables.map(row => (
											<li key={row.tableId}>
												<Link
													to={`/tables/${row.tableId}`}
													state={{ backTo: '/admin' }}
													className='flex flex-col gap-1 rounded-lg px-1.5 py-1 text-xs transition-colors hover:bg-muted/50'
												>
													<div className='flex items-center justify-between gap-2'>
														<span className='truncate font-medium text-foreground'>
															#{row.no} · {row.name}
														</span>
														<span className='flex shrink-0 items-center gap-1.5 tabular-nums text-foreground'>
															{row.total.toFixed(2)}
															{row.isOutlier && (
																<Badge
																	variant='outline'
																	className='h-4 gap-0.5 rounded-full border-destructive/50 px-1.5 text-[10px] text-destructive'
																>
																	<TriangleAlert className='size-2.5' />
																	{t('admin.stats.outlier')}
																</Badge>
															)}
														</span>
													</div>
													<span className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
														<span
															className={
																row.isOutlier
																	? 'block h-full rounded-full bg-destructive'
																	: 'block h-full rounded-full bg-primary'
															}
															style={{
																width: `${(row.total / maxTableSpend) * 100}%`,
															}}
														/>
													</span>
												</Link>
											</li>
										))}
									</ul>
								)}
							</Card>
						</div>
					</div>
				</>
			) : (
				<p className='rounded-2xl border border-dashed border-border/60 px-5 py-8 text-center text-sm text-muted-foreground'>
					{t('admin.dashboard.no_active_event')}
				</p>
			)}

			<div className='flex flex-col gap-3'>
				<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
					{t('admin.dashboard.past_events')}
				</p>
				<PastEventsList
					events={pastEvents}
					isLoading={pastLoading}
					selectedEventId={selectedEvent?.id}
					onSelectEvent={id => selectEvent(id === activeEvent?.id ? null : id)}
				/>
			</div>
		</div>
	)
}
