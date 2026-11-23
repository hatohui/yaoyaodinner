import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
	DoorOpen,
	History,
	Link as LinkIcon,
	Map,
	MoreHorizontal,
} from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { TableAuditDialog } from '@/pages/admin/tables/@TableAuditDialog'
import { LeaveTableButton, LeaveTableConfirm } from './@LeaveTableButton'

const actionButton =
	'inline-flex size-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-auto sm:px-3'

interface TableHeaderActionsProps {
	tableId: string
	roast: ReactNode
	canLeave: boolean
	mapHref?: string
	onShareLink: () => void
}

export function TableHeaderActions({
	tableId,
	roast,
	canLeave,
	mapHref,
	onShareLink,
}: TableHeaderActionsProps) {
	const { t } = useTranslation()
	const isWide = useMediaQuery('(min-width: 640px)')
	const [auditOpen, setAuditOpen] = useState(false)
	const [leaving, setLeaving] = useState(false)

	if (isWide) {
		return (
			<div className='flex shrink-0 items-center gap-2'>
				{canLeave && <LeaveTableButton />}
				{roast}
				{mapHref && (
					<Link
						to={mapHref}
						aria-label={t('floor_plan.view_map')}
						title={t('floor_plan.view_map')}
						className={actionButton}
					>
						<Map className='size-4' />
						<span>{t('floor_plan.view_map')}</span>
					</Link>
				)}
				<TableAuditDialog tableId={tableId} compact />
				<button
					type='button'
					onClick={onShareLink}
					aria-label={t('roster.copy_link')}
					title={t('roster.copy_link')}
					className={actionButton}
				>
					<LinkIcon className='size-4' />
					<span>{t('roster.copy_link')}</span>
				</button>
			</div>
		)
	}

	return (
		<div className='flex shrink-0 items-center gap-1.5'>
			{roast}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type='button'
						aria-label={t('common.more_actions')}
						title={t('common.more_actions')}
						className={actionButton}
					>
						<MoreHorizontal className='size-4' />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='min-w-44'>
					<DropdownMenuItem onSelect={onShareLink}>
						<LinkIcon />
						{t('roster.copy_link')}
					</DropdownMenuItem>
					{mapHref && (
						<DropdownMenuItem asChild>
							<Link to={mapHref}>
								<Map />
								{t('floor_plan.view_map')}
							</Link>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onSelect={() => setAuditOpen(true)}>
						<History />
						{t('table_audit.open')}
					</DropdownMenuItem>
					{canLeave && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant='destructive'
								onSelect={() => setLeaving(true)}
							>
								<DoorOpen />
								{t('table_code.leave')}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			<TableAuditDialog
				tableId={tableId}
				open={auditOpen}
				onOpenChange={setAuditOpen}
			/>
			{canLeave && (
				<LeaveTableConfirm open={leaving} onOpenChange={setLeaving} />
			)}
		</div>
	)
}
