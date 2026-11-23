import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useInfiniteQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
	ArchiveRestore,
	ArrowLeftRight,
	Crown,
	Flame,
	History,
	ImageIcon,
	ListPlus,
	MessageSquarePlus,
	Pencil,
	Plus,
	ShoppingCart,
	Sparkles,
	StickyNote,
	Trash2,
	TriangleAlert,
	Upload,
	UserMinus,
	UserPlus,
	Users,
	type LucideIcon,
} from 'lucide-react'
import {
	getGetTableAuditByTableQueryKey,
	getTableAuditByTable,
	useGetTableAudit,
} from '@/api/tables/tables'
import type {
	GetTableAuditByTableKind,
	TableAuditDto,
	TableAuditDtoAction,
} from '@/api/model'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { relativeTime } from '@/utils/relativeTime'
import { cn } from '@/utils/shadcn'

export const AUDIT_ICONS: Record<TableAuditDtoAction, LucideIcon> = {
	created: Plus,
	bulk_created: Plus,
	renamed: Pencil,
	capacity_changed: Users,
	banner_changed: ImageIcon,
	host_changed: Crown,
	numbers_swapped: ArrowLeftRight,
	moved_to_staging: ArchiveRestore,
	deleted: Trash2,
	ai_roast_table: Flame,
	ai_roast_guest: Flame,
	ai_plan: Sparkles,
	wish_added: ListPlus,
	wish_updated: Pencil,
	wish_removed: Trash2,
	order_added: ShoppingCart,
	order_updated: Pencil,
	order_removed: Trash2,
	person_added: UserPlus,
	person_renamed: Pencil,
	person_pfp_changed: ImageIcon,
	person_allergies_changed: TriangleAlert,
	person_removed: UserMinus,
	people_moved: ArrowLeftRight,
	note_saved: StickyNote,
	note_removed: Trash2,
	image_uploaded: Upload,
	feedback_added: MessageSquarePlus,
	feedback_removed: Trash2,
}

export const DESTRUCTIVE_AUDIT_ACTIONS = new Set<TableAuditDtoAction>([
	'deleted',
	'wish_removed',
	'order_removed',
	'person_removed',
	'note_removed',
	'feedback_removed',
])

export const AI_AUDIT_ACTIONS = new Set<TableAuditDtoAction>([
	'ai_roast_table',
	'ai_roast_guest',
	'ai_plan',
])

/** These read as a sentence that already names who did it, so the "by" chip is skipped. */
export const WHO_IN_MESSAGE_ACTIONS = new Set<TableAuditDtoAction>([
	'renamed',
	'person_renamed',
])

const AUDIT_COUNT = 200
const PAGE_SIZE = 30
const KINDS: GetTableAuditByTableKind[] = ['activity', 'ai']

export function auditMessageKey(entry: TableAuditDto) {
	const cleared = entry.details?.to == null
	if (entry.action === 'renamed' && !entry.details?.from)
		return 'renamed_unnamed'
	if (entry.action === 'renamed' && !entry.details?.to) return 'name_cleared'
	if (entry.action === 'banner_changed' && cleared) return 'banner_removed'
	if (entry.action === 'host_changed' && cleared) return 'host_removed'
	if (entry.action === 'person_pfp_changed' && cleared)
		return 'person_pfp_removed'
	return entry.action
}

export function auditWho(entry: TableAuditDto, t: TFunction) {
	if (entry.actor === 'admin') return t('table_audit.who_admin')
	return entry.details?.personName ?? t('table_audit.who_guest')
}

export function auditByLabel(entry: TableAuditDto, t: TFunction) {
	if (WHO_IN_MESSAGE_ACTIONS.has(entry.action)) return null
	if (entry.actor === 'admin') return t('table_audit.by_admin')
	if (entry.details?.personName)
		return t('table_audit.by_name', { name: entry.details.personName })
	return t('table_audit.by_guest')
}

export function auditEntryParams(entry: TableAuditDto, t: TFunction) {
	return {
		who: auditWho(entry, t),
		no: entry.tableNo,
		name: entry.tableName,
		from: entry.details?.from,
		to: entry.details?.to,
		withNo: entry.details?.withNo,
		withName: entry.details?.withName,
		count: entry.details?.count,
		seated: entry.details?.seated ?? 0,
		target: entry.details?.targetName,
	}
}

export function TableAuditDialog({
	className,
	tableId,
	compact,
	trigger,
	open: openProp,
	onOpenChange,
}: {
	className?: string
	tableId?: string
	compact?: boolean
	trigger?: React.ReactNode
	/** Pass to open it from elsewhere, such as a menu item; no trigger is rendered then. */
	open?: boolean
	onOpenChange?: (open: boolean) => void
}) {
	const { t, i18n } = useTranslation()
	const [innerOpen, setInnerOpen] = useState(false)
	const controlled = openProp !== undefined
	const open = controlled ? openProp : innerOpen
	const setOpen = onOpenChange ?? setInnerOpen
	const [kind, setKind] = useState<GetTableAuditByTableKind>('activity')
	const globalAudit = useGetTableAudit<TableAuditDto[]>(
		{ count: AUDIT_COUNT },
		{ query: { enabled: open && !tableId, refetchOnMount: 'always' } }
	)
	const tableAudit = useInfiniteQuery({
		queryKey: getGetTableAuditByTableQueryKey(tableId ?? '', { kind }),
		queryFn: ({ pageParam, signal }) =>
			getTableAuditByTable(
				tableId ?? '',
				{ kind, count: PAGE_SIZE, skip: pageParam },
				signal
			),
		initialPageParam: 0,
		getNextPageParam: (last, pages) =>
			last.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE,
		enabled: open && Boolean(tableId),
		refetchOnMount: 'always',
	})
	const isAiKind = kind === 'ai'
	const data = tableId
		? tableAudit.data?.pages.flat()
		: globalAudit.data?.filter(
				entry => AI_AUDIT_ACTIONS.has(entry.action) === isAiKind
			)
	const { isLoading, isError, error } = tableId ? tableAudit : globalAudit
	const showError =
		isError && !(isAxiosError(error) && error.response?.status === 404)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{!controlled && (
				<DialogTrigger asChild>
					{trigger ??
						(compact ? (
							<button
								type='button'
								aria-label={t('table_audit.open')}
								title={t('table_audit.open')}
								className={cn(
									'inline-flex size-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-auto sm:px-3',
									className
								)}
							>
								<History className='size-4' />
								<span className='hidden sm:inline'>
									{t('table_audit.open')}
								</span>
							</button>
						) : (
							<Button
								size='sm'
								variant='outline'
								className={cn('gap-1.5 rounded-full', className)}
							>
								<History className='size-4' />
								{t('table_audit.open')}
							</Button>
						))}
				</DialogTrigger>
			)}
			<DialogContent className='flex max-h-[85vh] flex-col rounded-3xl sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{t('table_audit.title')}</DialogTitle>
					<DialogDescription>
						{tableId
							? t('table_audit.table_description')
							: t('table_audit.description')}
					</DialogDescription>
				</DialogHeader>
				<div className='flex w-fit items-center gap-1 rounded-full border border-border/60 bg-background p-0.5'>
					{KINDS.map(k => (
						<button
							key={k}
							type='button'
							onClick={() => setKind(k)}
							className={cn(
								'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
								kind === k
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'
							)}
						>
							{k === 'ai' ? (
								<Sparkles className='size-3.5' />
							) : (
								<History className='size-3.5' />
							)}
							{t(`table_audit.tab_${k}`)}
						</button>
					))}
				</div>
				{isLoading ? (
					<div className='flex justify-center py-6'>
						<Spinner />
					</div>
				) : showError ? (
					<p className='py-6 text-center text-sm text-muted-foreground'>
						{t('table_audit.load_error')}
					</p>
				) : !data?.length ? (
					<p className='py-6 text-center text-sm text-muted-foreground'>
						{t('table_audit.empty')}
					</p>
				) : (
					<ul className='scrollbar-thin -mx-1 flex flex-col overflow-y-auto'>
						{data.map(entry => {
							const Icon = AUDIT_ICONS[entry.action]
							const by = auditByLabel(entry, t)
							return (
								<li
									key={entry.id}
									className='flex items-start gap-3 rounded-xl px-2 py-2.5'
								>
									<span
										className={cn(
											'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary',
											DESTRUCTIVE_AUDIT_ACTIONS.has(entry.action) &&
												'bg-destructive/10 text-destructive'
										)}
									>
										<Icon className='size-3.5' />
									</span>
									<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
										<p className='text-sm text-foreground'>
											{t(
												`table_audit.actions.${auditMessageKey(entry)}`,
												auditEntryParams(entry, t)
											)}
										</p>
										<p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
											<time
												dateTime={entry.createdAt}
												title={new Date(entry.createdAt).toLocaleString(
													i18n.language
												)}
											>
												{relativeTime(entry.createdAt, i18n.language)}
											</time>
											{by && (
												<span className='rounded-full bg-muted px-1.5 py-px font-medium'>
													{by}
												</span>
											)}
										</p>
									</div>
								</li>
							)
						})}
						{tableId && tableAudit.hasNextPage && (
							<li className='flex justify-center pt-2 pb-1'>
								<Button
									size='sm'
									variant='outline'
									className='gap-1.5 rounded-full'
									disabled={tableAudit.isFetchingNextPage}
									onClick={() => void tableAudit.fetchNextPage()}
								>
									{tableAudit.isFetchingNextPage && <Spinner />}
									{t('table_audit.load_more')}
								</Button>
							</li>
						)}
					</ul>
				)}
			</DialogContent>
		</Dialog>
	)
}
