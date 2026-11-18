import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
	useGetTableAudit,
	useGetTableAuditByTable,
} from '@/api/tables/tables'
import type { TableAuditDto, TableAuditDtoAction } from '@/api/model'
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

const ICONS: Record<TableAuditDtoAction, LucideIcon> = {
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

const DESTRUCTIVE_ACTIONS = new Set<TableAuditDtoAction>([
	'deleted',
	'wish_removed',
	'order_removed',
	'person_removed',
	'note_removed',
	'feedback_removed',
])

const AUDIT_COUNT = 200

function messageKey(entry: TableAuditDto) {
	const cleared = entry.details?.to == null
	if (entry.action === 'banner_changed' && cleared) return 'banner_removed'
	if (entry.action === 'host_changed' && cleared) return 'host_removed'
	if (entry.action === 'person_pfp_changed' && cleared)
		return 'person_pfp_removed'
	return entry.action
}

export function TableAuditDialog({
	className,
	tableId,
	compact,
}: {
	className?: string
	tableId?: string
	compact?: boolean
}) {
	const { t, i18n } = useTranslation()
	const [open, setOpen] = useState(false)
	const byLabel = (entry: TableAuditDto) => {
		if (entry.details?.personName)
			return t('table_audit.by_name', { name: entry.details.personName })
		if (entry.actor === 'guest') return t('table_audit.by_guest')
		if (entry.actor === 'admin') return t('table_audit.by_admin')
		return null
	}
	const globalAudit = useGetTableAudit<TableAuditDto[]>(
		{ count: AUDIT_COUNT },
		{ query: { enabled: open && !tableId, refetchOnMount: 'always' } }
	)
	const tableAudit = useGetTableAuditByTable<TableAuditDto[]>(
		tableId ?? '',
		{ count: AUDIT_COUNT },
		{ query: { enabled: open && Boolean(tableId), refetchOnMount: 'always' } }
	)
	const { data, isLoading, isError } = tableId ? tableAudit : globalAudit

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{compact ? (
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
						<span className='hidden sm:inline'>{t('table_audit.open')}</span>
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
				)}
			</DialogTrigger>
			<DialogContent className='flex max-h-[85vh] flex-col rounded-3xl sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{t('table_audit.title')}</DialogTitle>
					<DialogDescription>
						{tableId
							? t('table_audit.table_description')
							: t('table_audit.description')}
					</DialogDescription>
				</DialogHeader>
				{isLoading ? (
					<div className='flex justify-center py-6'>
						<Spinner />
					</div>
				) : isError ? (
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
							const Icon = ICONS[entry.action]
							return (
								<li
									key={entry.id}
									className='flex items-start gap-3 rounded-xl px-2 py-2.5'
								>
									<span
										className={cn(
											'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary',
											DESTRUCTIVE_ACTIONS.has(entry.action) &&
												'bg-destructive/10 text-destructive'
										)}
									>
										<Icon className='size-3.5' />
									</span>
									<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
										<p className='text-sm text-foreground'>
											{t(`table_audit.actions.${messageKey(entry)}`, {
												no: entry.tableNo,
												name: entry.tableName,
												from: entry.details?.from,
												to: entry.details?.to,
												withNo: entry.details?.withNo,
												withName: entry.details?.withName,
												count: entry.details?.count,
												seated: entry.details?.seated ?? 0,
												target: entry.details?.targetName,
											})}
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
											{byLabel(entry) && (
												<span className='rounded-full bg-muted px-1.5 py-px font-medium'>
													{byLabel(entry)}
												</span>
											)}
										</p>
									</div>
								</li>
							)
						})}
					</ul>
				)}
			</DialogContent>
		</Dialog>
	)
}
