import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	CheckCircle2,
	Copy,
	LayoutDashboard,
	Lock,
	Map,
	Megaphone,
	MessageSquareHeart,
	PauseCircle,
	PencilLine,
	RotateCcw,
	Settings,
	ShieldCheck,
	ShoppingCart,
	UtensilsCrossed,
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
import { Switch } from '@/components/ui/switch'
import { useAdmin } from '@/hooks/useAdmin'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useConfig } from '@/hooks/useConfig'
import { useEditMode } from '@/hooks/useEditMode'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/shadcn'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { BannerDialog } from '@/components/common/BannerDialog'
import {
	useUpdateConfig,
	getGetConfigQueryKey,
	getGetPublicConfigQueryKey,
} from '@/api/config/config'
import type { StoredOrderingStage } from '@/api/model'

type PendingStageAction =
	| StoredOrderingStage
	| 'reopen'
	| 'reopen_orders'
	| null

export function AdminMenu() {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const { isAdmin, editing, toggle } = useEditMode()
	const lock = useAdmin(s => s.clear)
	const { activeEvent, setStage, settingStage } = useAdminEvents()
	const { bannerEnabled, bannerMessage, menu, floorPlan, feedbackWall } =
		useConfig()

	const [bannerOpen, setBannerOpen] = useState(false)
	const [pendingStage, setPendingStage] = useState<PendingStageAction>(null)

	const { mutate: updateConfig } = useUpdateConfig({
		mutation: {
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: getGetConfigQueryKey() })
				qc.invalidateQueries({ queryKey: getGetPublicConfigQueryKey() })
				toast.success(t('admin.settings.saved'))
			},
			onError: () => toast.error(t('admin.settings.save_failed')),
		},
	})

	if (!isAdmin) return null

	const toggleConfig = (key: string, current: boolean) => {
		updateConfig({ key, data: { value: current ? 'false' : 'true' } })
	}

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
						title={editing ? t('admin.edit_mode.on') : t('admin.nav.title')}
						className={cn(
							'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20',
							editing && 'bg-primary/10 ring-2 ring-primary/50'
						)}
					>
						<ShieldCheck className='size-4' />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='min-w-64'>
					<DropdownMenuLabel className='flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
						<span>{t('admin.nav.title')}</span>
						{activeEvent?.name && (
							<span className='max-w-28 truncate font-normal normal-case text-muted-foreground'>
								{activeEvent.name}
							</span>
						)}
					</DropdownMenuLabel>

					<DropdownMenuItem
						onSelect={e => {
							e.preventDefault()
							toggle()
						}}
						className='cursor-pointer'
					>
						<PencilLine className='size-4' />
						<span className='flex-1'>{t('admin.edit_mode.label')}</span>
						<Switch checked={editing} size='sm' className='pointer-events-none' />
					</DropdownMenuItem>

					{activeEvent && (
						<>
							<DropdownMenuSeparator />
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
									onSelect={e => {
										e.preventDefault()
										setTimeout(() => setPendingStage('open'), 0)
									}}
								>
									<ShoppingCart className='size-4' />
									{t('admin.ordering.open')}…
								</DropdownMenuItem>
							)}

							{stage === 'open' && (
								<>
									<DropdownMenuItem
										disabled={settingStage}
										onSelect={e => {
											e.preventDefault()
											setTimeout(() => setPendingStage('closed'), 0)
										}}
									>
										<PauseCircle className='size-4' />
										{t('admin.ordering.pause')}…
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={settingStage}
										onSelect={e => {
											e.preventDefault()
											setTimeout(() => setPendingStage('confirmed'), 0)
										}}
									>
										<Lock className='size-4' />
										{t('admin.ordering.confirm')}…
									</DropdownMenuItem>
								</>
							)}

							{stage === 'confirmed' && (
								<DropdownMenuItem
									disabled={settingStage}
									onSelect={e => {
										e.preventDefault()
										setTimeout(() => setPendingStage('reopen_orders'), 0)
									}}
								>
									<RotateCcw className='size-4' />
									{t('admin.ordering.reopen_orders')}…
								</DropdownMenuItem>
							)}

							{stage !== 'closed' && stage !== 'finalized' && (
								<DropdownMenuItem
									disabled={settingStage}
									onSelect={e => {
										e.preventDefault()
										setTimeout(() => setPendingStage('finalized'), 0)
									}}
									className='font-medium text-emerald-700 dark:text-emerald-300'
								>
									<CheckCircle2 className='size-4 text-emerald-600 dark:text-emerald-400' />
									{t('admin.ordering.finalize')}…
								</DropdownMenuItem>
							)}

							{stage === 'finalized' && (
								<DropdownMenuItem
									disabled={settingStage}
									onSelect={e => {
										e.preventDefault()
										setTimeout(() => setPendingStage('reopen'), 0)
									}}
								>
									<RotateCcw className='size-4' />
									{t('admin.ordering.reopen')}…
								</DropdownMenuItem>
							)}

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

					<DropdownMenuSeparator />
					<DropdownMenuLabel className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
						{t('admin.settings.category_features')}
					</DropdownMenuLabel>

					<DropdownMenuItem
						onSelect={e => {
							e.preventDefault()
							setTimeout(() => setBannerOpen(true), 0)
						}}
						className='cursor-pointer'
					>
						<Megaphone className='size-4' />
						<span className='flex-1'>{t('admin.settings.category_banner')}…</span>
						<Switch
							checked={bannerEnabled}
							size='sm'
							onClick={e => {
								e.stopPropagation()
								if (!bannerMessage && !bannerEnabled) {
									setTimeout(() => setBannerOpen(true), 0)
									return
								}
								toggleConfig('banner.enabled', bannerEnabled)
							}}
							onCheckedChange={() => {
								if (!bannerMessage && !bannerEnabled) {
									setTimeout(() => setBannerOpen(true), 0)
									return
								}
								toggleConfig('banner.enabled', bannerEnabled)
							}}
						/>
					</DropdownMenuItem>

					<DropdownMenuItem
						onSelect={e => {
							e.preventDefault()
							toggleConfig('feature.ordering', menu)
						}}
						className='cursor-pointer'
					>
						<UtensilsCrossed className='size-4' />
						<span className='flex-1'>{t('admin.features.menu')}</span>
						<Switch checked={menu} size='sm' className='pointer-events-none' />
					</DropdownMenuItem>

					<DropdownMenuItem
						onSelect={e => {
							e.preventDefault()
							toggleConfig('feature.floorPlan', floorPlan)
						}}
						className='cursor-pointer'
					>
						<Map className='size-4' />
						<span className='flex-1'>
							{t('floor_plan.view_map', { defaultValue: 'Floor plan' })}
						</span>
						<Switch checked={floorPlan} size='sm' className='pointer-events-none' />
					</DropdownMenuItem>

					<DropdownMenuItem
						onSelect={e => {
							e.preventDefault()
							toggleConfig('feature.feedbackWall', feedbackWall)
						}}
						className='cursor-pointer'
					>
						<MessageSquareHeart className='size-4' />
						<span className='flex-1'>{t('admin.settings.category_feedback')}</span>
						<Switch
							checked={feedbackWall}
							size='sm'
							className='pointer-events-none'
						/>
					</DropdownMenuItem>

					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Link to='/admin'>
							<LayoutDashboard className='size-4' />
							{t('admin.nav.dashboard')}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link to='/admin/settings'>
							<Settings className='size-4' />
							{t('admin.nav.settings')}
						</Link>
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
				open={pendingStage === 'open'}
				onOpenChange={open => !open && setPendingStage(null)}
				title={t('admin.ordering.open_title', {
					defaultValue: 'Open pre-orders?',
				})}
				description={t('admin.ordering.open_body', {
					defaultValue:
						'Guests will be able to browse the menu and submit pre-orders for their tables.',
				})}
				confirmLabel={t('admin.ordering.open')}
				destructive={false}
				onConfirm={() => confirmStage('open')}
			/>

			<ConfirmDialog
				open={pendingStage === 'closed'}
				onOpenChange={open => !open && setPendingStage(null)}
				title={t('admin.ordering.pause_title')}
				description={t('admin.ordering.pause_body')}
				confirmLabel={t('admin.ordering.pause')}
				destructive={false}
				onConfirm={() => confirmStage('closed')}
			/>

			<ConfirmDialog
				open={pendingStage === 'reopen_orders'}
				onOpenChange={open => !open && setPendingStage(null)}
				title={t('admin.ordering.reopen_orders_title')}
				description={t('admin.ordering.reopen_orders_body')}
				confirmLabel={t('admin.ordering.reopen_orders')}
				destructive={false}
				onConfirm={() => confirmStage('open')}
			/>

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
