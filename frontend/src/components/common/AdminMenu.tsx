import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	CheckCircle2,
	Copy,
	Lock,
	Megaphone,
	RotateCcw,
	ShieldCheck,
	ShoppingCart,
} from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAdmin } from '@/hooks/useAdmin'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useToast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { BannerDialog } from '@/components/common/BannerDialog'
import type { StoredOrderingStage } from '@/api/model'

type PendingStageAction = StoredOrderingStage | 'reopen' | null

export function AdminMenu() {
	const { t } = useTranslation()
	const toast = useToast()
	const lock = useAdmin(s => s.clear)
	const { activeEvent, setStage, settingStage } = useAdminEvents()

	const [bannerOpen, setBannerOpen] = useState(false)
	const [pendingStage, setPendingStage] = useState<PendingStageAction>(null)

	const copyPin = async () => {
		if (!activeEvent?.pin) return
		await navigator.clipboard.writeText(activeEvent.pin)
		toast.success(t('admin.dashboard.pin_copied'))
	}

	const confirmStage = (next: StoredOrderingStage, passphrase?: string) => {
		if (!activeEvent) return
		setStage(activeEvent.id, next, passphrase)
		setPendingStage(null)
	}

	const stage = activeEvent?.orderingStage ?? 'closed'
	const stageLabel = {
		closed: t('admin.ordering.stage_closed'),
		open: t('admin.ordering.stage_open'),
		confirmed: t('admin.ordering.stage_confirmed'),
		dinner: t('admin.ordering.stage_dinner'),
		finalized: t('admin.ordering.stage_finalized'),
	}[stage]

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<button
						type='button'
						aria-label={t('admin.nav.title')}
						title={t('admin.nav.title')}
						className='flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-card/85 hover:text-primary dark:hover:bg-accent/50'
					>
						<ShieldCheck className='size-4' />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='min-w-60'>
					<DropdownMenuLabel className='flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
						<span>{t('admin.nav.title')}</span>
						{activeEvent?.name && (
							<span className='max-w-28 truncate font-normal normal-case text-muted-foreground'>
								{activeEvent.name}
							</span>
						)}
					</DropdownMenuLabel>

					{activeEvent && (
						<>
							<div className='flex items-center justify-between px-2 py-1.5 text-xs'>
								<span className='font-medium text-muted-foreground'>
									{t('admin.ordering.title')}
								</span>
								<Badge
									variant='secondary'
									className='rounded-full border border-primary/25 bg-primary/10 px-2 py-0 text-[11px] font-medium text-primary'
								>
									{stageLabel}
								</Badge>
							</div>

							{stage === 'closed' && (
								<DropdownMenuItem
									disabled={settingStage}
									onSelect={() => confirmStage('open')}
								>
									<ShoppingCart className='size-4' />
									{t('admin.ordering.open')}
								</DropdownMenuItem>
							)}

							{stage === 'open' && (
								<DropdownMenuItem
									disabled={settingStage}
									onSelect={() => setPendingStage('confirmed')}
								>
									<Lock className='size-4' />
									{t('admin.ordering.confirm')}
								</DropdownMenuItem>
							)}

							{stage !== 'closed' && stage !== 'finalized' && (
								<DropdownMenuItem
									disabled={settingStage}
									onSelect={() => setPendingStage('finalized')}
									className='text-emerald-700 dark:text-emerald-300 font-medium'
								>
									<CheckCircle2 className='size-4 text-emerald-600 dark:text-emerald-400' />
									{t('admin.ordering.finalize')}
								</DropdownMenuItem>
							)}

							{stage === 'finalized' && (
								<DropdownMenuItem
									disabled={settingStage}
									onSelect={() => setPendingStage('reopen')}
								>
									<RotateCcw className='size-4' />
									{t('admin.ordering.reopen')}
								</DropdownMenuItem>
							)}

							<DropdownMenuSeparator />

							<DropdownMenuItem onSelect={copyPin}>
								<Copy className='size-4' />
								<span className='flex flex-1 items-center justify-between gap-2'>
									<span>{t('admin.dashboard.copy_pin')} PIN</span>
									<span className='font-mono text-xs font-semibold tracking-wider text-muted-foreground'>
										{activeEvent.pin}
									</span>
								</span>
							</DropdownMenuItem>
						</>
					)}

					<DropdownMenuItem onSelect={() => setBannerOpen(true)}>
						<Megaphone className='size-4' />
						{t('admin.settings.category_banner')}
					</DropdownMenuItem>

					<DropdownMenuSeparator />
					<DropdownMenuItem variant='destructive' onSelect={lock}>
						<Lock className='size-4' />
						{t('admin.nav.lock')}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<BannerDialog open={bannerOpen} onOpenChange={setBannerOpen} />

			<ConfirmDialog
				open={pendingStage === 'confirmed'}
				onOpenChange={open => !open && setPendingStage(null)}
				title={t('admin.ordering.confirm_title')}
				description={t('admin.ordering.confirm_body')}
				confirmLabel={t('admin.ordering.confirm')}
				onConfirm={() => confirmStage('confirmed')}
			/>

			<ConfirmDialog
				open={pendingStage === 'finalized'}
				onOpenChange={open => !open && setPendingStage(null)}
				title={t('admin.ordering.finalize_title')}
				description={t('admin.ordering.finalize_body')}
				confirmLabel={t('admin.ordering.finalize')}
				destructive={false}
				actionClassName='bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-sm'
				onConfirm={() => confirmStage('finalized')}
			/>

			<ConfirmDialog
				open={pendingStage === 'reopen'}
				onOpenChange={open => !open && setPendingStage(null)}
				title={t('admin.ordering.reopen_title')}
				description={t('admin.ordering.reopen_body')}
				confirmLabel={t('admin.ordering.reopen')}
				requirePassphrase
				onConfirm={passphrase => confirmStage('confirmed', passphrase)}
			/>
		</>
	)
}
