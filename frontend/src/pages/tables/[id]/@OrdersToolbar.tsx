import { useTranslation } from 'react-i18next'
import {
	Download,
	Eye,
	EyeOff,
	LayoutGrid,
	MoreHorizontal,
	ReceiptText,
	Rows3,
	Users,
	UtensilsCrossed,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewToggle, type ListView } from '@/components/common/ViewToggle'
import { cn } from '@/utils/shadcn'
import type { OrdersSubView } from './@OrdersTab'

interface OrdersToolbarProps {
	isDesktop: boolean
	subView: OrdersSubView
	onSubViewChange?: (view: OrdersSubView) => void
	showListActions: boolean
	hideFree?: { hidden: boolean; onToggle: () => void }
	onDownload?: () => void
	view: ListView
	onViewChange: (view: ListView) => void
}

export function OrdersToolbar({
	isDesktop,
	subView,
	onSubViewChange,
	showListActions,
	hideFree,
	onDownload,
	view,
	onViewChange,
}: OrdersToolbarProps) {
	const { t } = useTranslation()
	const subOptions = [
		{ value: 'dishes', icon: UtensilsCrossed, label: t('tabs.orders') },
		{ value: 'people', icon: Users, label: t('tabs.splits') },
		{ value: 'receipt', icon: ReceiptText, label: t('split.view_receipt') },
	] as const

	if (!onSubViewChange && !showListActions) return null

	return (
		<div className='flex items-center gap-2'>
			{onSubViewChange && (
				<div
					role='tablist'
					className='grid h-9 flex-1 grid-cols-3 items-center gap-0.5 rounded-xl border border-border bg-control p-0.5 shadow-2xs sm:inline-flex sm:h-8 sm:flex-none'
				>
					{subOptions.map(({ value, icon: Icon, label }) => (
						<button
							key={value}
							type='button'
							role='tab'
							aria-selected={subView === value}
							onClick={() => onSubViewChange(value)}
							className={cn(
								'flex h-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors',
								subView === value
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'
							)}
						>
							<Icon className='size-3.5' />
							{label}
						</button>
					))}
				</div>
			)}
			{showListActions &&
				(isDesktop ? (
					<div className='ml-auto flex shrink-0 items-center gap-1.5'>
						{hideFree && (
							<Button
								variant='outline'
								size='icon-sm'
								className={cn(
									'size-8 rounded-xl',
									hideFree.hidden &&
										'border-primary/40 bg-primary/10 text-primary'
								)}
								aria-pressed={hideFree.hidden}
								aria-label={t(
									hideFree.hidden ? 'orders.show_free' : 'orders.hide_free'
								)}
								title={t(
									hideFree.hidden ? 'orders.show_free' : 'orders.hide_free'
								)}
								onClick={hideFree.onToggle}
							>
								{hideFree.hidden ? (
									<EyeOff className='size-3.5' />
								) : (
									<Eye className='size-3.5' />
								)}
							</Button>
						)}
						{onDownload && (
							<Button
								variant='outline'
								size='icon-sm'
								className='size-8 rounded-xl'
								aria-label={t('common.download_image')}
								title={t('common.download_image')}
								onClick={onDownload}
							>
								<Download className='size-3.5' />
							</Button>
						)}
						<ViewToggle view={view} onChange={onViewChange} />
					</div>
				) : (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='outline'
								size='icon-sm'
								aria-label={t('common.more_actions')}
								title={t('common.more_actions')}
								className='ml-auto size-9 shrink-0 rounded-xl'
							>
								<MoreHorizontal className='size-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onSelect={() =>
									onViewChange(view === 'card' ? 'compact' : 'card')
								}
							>
								{view === 'card' ? <Rows3 /> : <LayoutGrid />}
								{t(
									view === 'card' ? 'tables.view_compact' : 'tables.view_card'
								)}
							</DropdownMenuItem>
							{hideFree && (
								<DropdownMenuItem onSelect={hideFree.onToggle}>
									{hideFree.hidden ? <Eye /> : <EyeOff />}
									{t(hideFree.hidden ? 'orders.show_free' : 'orders.hide_free')}
								</DropdownMenuItem>
							)}
							{onDownload && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem onSelect={onDownload}>
										<Download />
										{t('common.download_image')}
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				))}
		</div>
	)
}
