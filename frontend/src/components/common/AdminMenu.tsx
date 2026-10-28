import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	Copy,
	KeyRound,
	Lock,
	Map,
	Megaphone,
	MessageSquareHeart,
	PencilLine,
	ShieldCheck,
	ShoppingCart,
} from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	useUpdateConfig,
	getGetConfigQueryKey,
	getGetPublicConfigQueryKey,
} from '@/api/config/config'
import { useAdmin } from '@/hooks/useAdmin'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useConfig } from '@/hooks/useConfig'
import { useEditMode } from '@/hooks/useEditMode'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/shadcn'

export function AdminMenu() {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const { isAdmin, editing, toggle } = useEditMode()
	const lock = useAdmin(s => s.clear)
	const { activeEvent, setStage, settingStage } = useAdminEvents()
	const { bannerEnabled, tableCodes, floorPlan, feedbackWall } = useConfig()

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

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					aria-label={t('admin.nav.title')}
					title={editing ? t('admin.edit_mode.on') : t('admin.nav.title')}
					className={cn(
						'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors',
						editing
							? 'bg-primary text-primary-foreground shadow-sm'
							: 'text-destructive hover:bg-card/85 dark:hover:bg-accent/50'
					)}
				>
					{editing ? (
						<PencilLine className='size-4' />
					) : (
						<ShieldCheck className='size-4' />
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='min-w-56'>
				<DropdownMenuLabel className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
					{t('admin.nav.title')}
				</DropdownMenuLabel>
				<DropdownMenuCheckboxItem
					checked={editing}
					onCheckedChange={toggle}
					onSelect={e => e.preventDefault()}
				>
					<PencilLine />
					{t('admin.edit_mode.label')}
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={bannerEnabled}
					onCheckedChange={() => toggleConfig('banner.enabled', bannerEnabled)}
					onSelect={e => e.preventDefault()}
				>
					<Megaphone />
					{t('admin.settings.category_banner')}
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={tableCodes}
					onCheckedChange={() => toggleConfig('feature.tableCodes', tableCodes)}
					onSelect={e => e.preventDefault()}
				>
					<KeyRound />
					{t('admin.tables.codes_sheet')}
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={floorPlan}
					onCheckedChange={() => toggleConfig('feature.floorPlan', floorPlan)}
					onSelect={e => e.preventDefault()}
				>
					<Map />
					{t('floor_plan.view_map')}
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={feedbackWall}
					onCheckedChange={() =>
						toggleConfig('feature.feedbackWall', feedbackWall)
					}
					onSelect={e => e.preventDefault()}
				>
					<MessageSquareHeart />
					{t('admin.settings.category_feedback')}
				</DropdownMenuCheckboxItem>

				{activeEvent && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={copyPin}>
							<Copy />
							<span className='flex flex-1 items-center justify-between gap-2'>
								<span>{t('admin.dashboard.copy_pin')} PIN</span>
								<span className='font-mono text-xs font-semibold tracking-wider text-muted-foreground'>
									{activeEvent.pin}
								</span>
							</span>
						</DropdownMenuItem>
						{activeEvent.orderingStage === 'closed' && (
							<DropdownMenuItem
								disabled={settingStage}
								onSelect={() => setStage(activeEvent.id, 'open')}
							>
								<ShoppingCart />
								{t('admin.ordering.open')}
							</DropdownMenuItem>
						)}
						{activeEvent.orderingStage === 'open' && (
							<DropdownMenuItem
								disabled={settingStage}
								onSelect={() => setStage(activeEvent.id, 'confirmed')}
							>
								<Lock />
								{t('admin.ordering.confirm')}
							</DropdownMenuItem>
						)}
					</>
				)}

				<DropdownMenuSeparator />
				<DropdownMenuItem variant='destructive' onSelect={lock}>
					<Lock />
					{t('admin.nav.lock')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
