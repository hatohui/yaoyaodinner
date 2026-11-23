import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
	Armchair,
	History,
	ImageIcon,
	RefreshCw,
	Search,
	Users,
} from 'lucide-react'
import { useGetTableAudit } from '@/api/tables/tables'
import type { TableAuditDto, TableAuditDtoAction } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { relativeTime } from '@/utils/relativeTime'
import { cn } from '@/utils/shadcn'
import {
	AI_AUDIT_ACTIONS,
	AUDIT_ICONS,
	DESTRUCTIVE_AUDIT_ACTIONS,
	auditEntryParams,
	auditMessageKey,
} from '../tables/@TableAuditDialog'

const AUDIT_LIMIT = 500

type Category =
	| 'all'
	| 'plan'
	| 'orders'
	| 'people'
	| 'tables'
	| 'images'
	| 'ai'
	| 'feedback'

const CATEGORIES: Category[] = [
	'all',
	'plan',
	'orders',
	'people',
	'tables',
	'images',
	'ai',
	'feedback',
]

const CATEGORY_ACTIONS: Record<Exclude<Category, 'all'>, Set<TableAuditDtoAction>> = {
	plan: new Set(['wish_added', 'wish_updated', 'wish_removed']),
	orders: new Set(['order_added', 'order_updated', 'order_removed']),
	people: new Set([
		'person_added',
		'person_renamed',
		'person_pfp_changed',
		'person_allergies_changed',
		'person_removed',
		'people_moved',
		'note_saved',
		'note_removed',
	]),
	tables: new Set([
		'created',
		'bulk_created',
		'renamed',
		'capacity_changed',
		'banner_changed',
		'host_changed',
		'numbers_swapped',
		'moved_to_staging',
		'deleted',
	]),
	images: new Set(['image_uploaded', 'banner_changed', 'person_pfp_changed']),
	ai: AI_AUDIT_ACTIONS,
	feedback: new Set(['feedback_added', 'feedback_removed']),
}

const IMAGE_ACTIONS = CATEGORY_ACTIONS.images

export default function AdminHistoryPage() {
	const { t, i18n } = useTranslation()
	const [search, setSearch] = useState('')
	const [category, setCategory] = useState<Category>('all')
	const [actor, setActor] = useState<'all' | 'guest' | 'admin'>('all')
	const [tableFilter, setTableFilter] = useState<string>('all')

	const { data, isLoading, isError, isFetching, refetch } = useGetTableAudit<
		TableAuditDto[]
	>({ count: AUDIT_LIMIT }, { query: { refetchOnMount: 'always' } })

	const entries = data ?? []

	const tableOptions = useMemo(() => {
		const map = new Map<string, { id: string; no: number | null; name: string | null }>()
		for (const e of entries) {
			if (!e.tableId || map.has(e.tableId)) continue
			map.set(e.tableId, { id: e.tableId, no: e.tableNo ?? null, name: e.tableName ?? null })
		}
		return [...map.values()].sort((a, b) => (a.no ?? 9999) - (b.no ?? 9999))
	}, [entries])

	const stats = useMemo(() => {
		let guestCount = 0
		let imageCount = 0
		const tables = new Set<string>()
		for (const e of entries) {
			if (e.actor === 'guest') guestCount += 1
			if (IMAGE_ACTIONS.has(e.action)) imageCount += 1
			if (e.tableId) tables.add(e.tableId)
		}
		return {
			total: entries.length,
			guestCount,
			imageCount,
			tableCount: tables.size,
		}
	}, [entries])

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		return entries.filter(entry => {
			if (category !== 'all' && !CATEGORY_ACTIONS[category].has(entry.action)) {
				return false
			}
			if (actor !== 'all' && entry.actor !== actor) return false
			if (tableFilter !== 'all' && entry.tableId !== tableFilter) return false
			if (!q) return true
			const msg = t(
				`table_audit.actions.${auditMessageKey(entry)}`,
				auditEntryParams(entry)
			).toLowerCase()
			const person = entry.details?.personName?.toLowerCase() ?? ''
			const target = entry.details?.targetName?.toLowerCase() ?? ''
			const tableName = entry.tableName?.toLowerCase() ?? ''
			return (
				msg.includes(q) ||
				person.includes(q) ||
				target.includes(q) ||
				tableName.includes(q)
			)
		})
	}, [entries, category, actor, tableFilter, search, t])

	const byLabel = (entry: TableAuditDto) => {
		if (entry.details?.personName)
			return t('table_audit.by_name', { name: entry.details.personName })
		if (entry.actor === 'guest') return t('table_audit.by_guest')
		if (entry.actor === 'admin') return t('table_audit.by_admin')
		return null
	}

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-wrap items-start justify-between gap-3'>
				<div className='flex flex-col gap-1'>
					<h1 className='text-xl font-bold text-foreground'>
						{t('admin.history.title')}
					</h1>
					<p className='text-sm text-muted-foreground'>
						{t('admin.history.subtitle')}
					</p>
				</div>
				<Button
					size='sm'
					variant='outline'
					onClick={() => void refetch()}
					disabled={isFetching}
					className='gap-1.5 rounded-full'
				>
					<RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
					{t('admin.history.refresh')}
				</Button>
			</div>

			<div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
				<Card className='gap-1.5 rounded-2xl px-4 py-3.5'>
					<div className='flex items-center gap-2 text-muted-foreground'>
						<History className='size-4 text-primary' />
						<span className='text-xs font-medium uppercase tracking-wide'>
							{t('admin.history.kpi_total')}
						</span>
					</div>
					<span className='text-2xl font-bold tabular-nums text-foreground'>
						{stats.total}
					</span>
				</Card>
				<Card className='gap-1.5 rounded-2xl px-4 py-3.5'>
					<div className='flex items-center gap-2 text-muted-foreground'>
						<Users className='size-4 text-primary' />
						<span className='text-xs font-medium uppercase tracking-wide'>
							{t('admin.history.kpi_guests')}
						</span>
					</div>
					<span className='text-2xl font-bold tabular-nums text-foreground'>
						{stats.guestCount}
					</span>
				</Card>
				<Card className='gap-1.5 rounded-2xl px-4 py-3.5'>
					<div className='flex items-center gap-2 text-muted-foreground'>
						<ImageIcon className='size-4 text-primary' />
						<span className='text-xs font-medium uppercase tracking-wide'>
							{t('admin.history.kpi_images')}
						</span>
					</div>
					<span className='text-2xl font-bold tabular-nums text-foreground'>
						{stats.imageCount}
					</span>
				</Card>
				<Card className='gap-1.5 rounded-2xl px-4 py-3.5'>
					<div className='flex items-center gap-2 text-muted-foreground'>
						<Armchair className='size-4 text-primary' />
						<span className='text-xs font-medium uppercase tracking-wide'>
							{t('admin.history.kpi_tables')}
						</span>
					</div>
					<span className='text-2xl font-bold tabular-nums text-foreground'>
						{stats.tableCount}
					</span>
				</Card>
			</div>

			<Card className='gap-4 rounded-2xl p-4'>
				<div className='flex flex-col gap-3'>
					<div className='flex flex-wrap items-center gap-2'>
						<div className='relative min-w-52 flex-1'>
							<Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
							<Input
								value={search}
								onChange={e => setSearch(e.target.value)}
								placeholder={t('admin.history.search_placeholder')}
								className='h-9 rounded-full pl-9'
							/>
						</div>

						<Select value={tableFilter} onValueChange={setTableFilter}>
							<SelectTrigger className='h-9 w-44 rounded-full'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									{t('admin.history.all_tables')}
								</SelectItem>
								{tableOptions.map(tbl => (
									<SelectItem key={tbl.id} value={tbl.id}>
										{tbl.no != null
											? `${t('admin.history.table_tag', { no: tbl.no })}${tbl.name ? ` · ${tbl.name}` : ''}`
											: tbl.name || tbl.id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className='flex items-center gap-1 rounded-full border border-border/60 bg-background p-0.5'>
							{(['all', 'guest', 'admin'] as const).map(a => (
								<button
									key={a}
									type='button'
									onClick={() => setActor(a)}
									className={cn(
										'cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors',
										actor === a
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground'
									)}
								>
									{a === 'all'
										? t('admin.history.all_actors')
										: a === 'guest'
											? t('admin.history.actors_guest')
											: t('admin.history.actors_admin')}
								</button>
							))}
						</div>
					</div>

					<div className='flex flex-wrap items-center justify-between gap-2'>
						<div className='flex flex-wrap items-center gap-1.5'>
							{CATEGORIES.map(cat => (
								<button
									key={cat}
									type='button'
									onClick={() => setCategory(cat)}
									className={cn(
										'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
										category === cat
											? 'border-primary bg-primary/15 text-primary'
											: 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
									)}
								>
									{t(`admin.history.categories.${cat}`)}
								</button>
							))}
						</div>
						{!isLoading && entries.length > 0 && (
							<span className='text-xs tabular-nums text-muted-foreground'>
								{t('admin.history.showing', {
									shown: filtered.length,
									total: entries.length,
								})}
							</span>
						)}
					</div>
				</div>

				{isLoading ? (
					<div className='flex justify-center py-12'>
						<Spinner />
					</div>
				) : isError ? (
					<p className='py-12 text-center text-sm text-muted-foreground'>
						{t('table_audit.load_error')}
					</p>
				) : !entries.length ? (
					<p className='py-12 text-center text-sm text-muted-foreground'>
						{t('table_audit.empty')}
					</p>
				) : !filtered.length ? (
					<p className='py-12 text-center text-sm text-muted-foreground'>
						{t('admin.history.no_matches')}
					</p>
				) : (
					<ul className='divide-y divide-border/50'>
						{filtered.map(entry => {
							const Icon = AUDIT_ICONS[entry.action]
							const label = byLabel(entry)
							return (
								<li
									key={entry.id}
									className='flex items-start gap-3 py-3 first:pt-1 last:pb-1'
								>
									<span
										className={cn(
											'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary',
											DESTRUCTIVE_AUDIT_ACTIONS.has(entry.action) &&
												'bg-destructive/10 text-destructive'
										)}
									>
										<Icon className='size-4' />
									</span>
									<div className='flex min-w-0 flex-1 flex-col gap-1'>
										<div className='flex flex-wrap items-baseline justify-between gap-2'>
											<p className='text-sm text-foreground'>
												{t(
													`table_audit.actions.${auditMessageKey(entry)}`,
													auditEntryParams(entry)
												)}
											</p>
											<time
												dateTime={entry.createdAt}
												title={new Date(entry.createdAt).toLocaleString(
													i18n.language
												)}
												className='shrink-0 text-xs tabular-nums text-muted-foreground'
											>
												{relativeTime(entry.createdAt, i18n.language)}
											</time>
										</div>
										<div className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
											{label && (
												<span className='rounded-full bg-muted px-2 py-0.5 font-medium text-foreground/80'>
													{label}
												</span>
											)}
											{entry.tableId && entry.tableNo != null && (
												<Link
													to={`/tables/${entry.tableId}`}
													state={{ backTo: '/admin/history' }}
													className='rounded-full border border-border/60 px-2 py-0.5 transition-colors hover:border-primary/40 hover:text-primary'
												>
													{t('admin.history.table_tag', { no: entry.tableNo })}
													{entry.tableName ? ` · ${entry.tableName}` : ''}
												</Link>
											)}
											{entry.action === 'image_uploaded' &&
												entry.details?.targetName && (
													<span className='max-w-xs truncate rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[11px]'>
														{entry.details.targetName}
													</span>
												)}
										</div>
									</div>
								</li>
							)
						})}
					</ul>
				)}
			</Card>
		</div>
	)
}
