import { useTranslation } from 'react-i18next'
import {
	ClipboardCopy,
	Download,
	LayoutGrid,
	MoreHorizontal,
	Rows3,
	Wand2,
	Zap,
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

interface PlanToolbarProps {
	isDesktop: boolean
	applyCount: number
	onApply?: () => void
	onModify?: () => void
	isEmpty: boolean
	onDownload: () => void
	onCopy: () => void
	view: ListView
	onViewChange: (view: ListView) => void
}

export function PlanToolbar({
	isDesktop,
	applyCount,
	onApply,
	onModify,
	isEmpty,
	onDownload,
	onCopy,
	view,
	onViewChange,
}: PlanToolbarProps) {
	const { t } = useTranslation()

	return (
		<div className='flex flex-wrap items-center gap-1.5 sm:gap-2'>
			{onApply && (
				<Button
					size='sm'
					onClick={onApply}
					className='h-8 shrink-0 gap-1.5 rounded-xl px-3 text-sm'
				>
					<Zap className='size-4' />
					{t('plan_board.apply_plan', { count: applyCount })}
				</Button>
			)}
			{onModify && (
				<Button
					variant='outline'
					size='sm'
					onClick={onModify}
					aria-label={t('table_plan.modify_cta')}
					title={t('table_plan.modify_cta')}
					className='relative h-8 shrink-0 gap-1.5 overflow-hidden rounded-xl border-2 border-dashed border-ai/70 bg-ai-muted px-2.5 text-xs font-semibold text-ai shadow-sm before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1/3 before:bg-gradient-to-r before:from-transparent before:via-ai/25 before:to-transparent hover:border-solid hover:border-ai hover:bg-ai-muted hover:text-ai dark:border-ai/70 dark:bg-ai-muted dark:hover:border-ai dark:hover:bg-ai-muted sm:px-3 sm:text-sm motion-safe:before:animate-ai-sheen'
				>
					<Wand2 className='size-4 motion-safe:animate-ai-twinkle' />
					<span className='sm:hidden'>{t('table_plan.modify_cta_short')}</span>
					<span className='hidden sm:inline'>{t('table_plan.modify_cta')}</span>
				</Button>
			)}
			{isDesktop ? (
				<div className='ml-auto flex shrink-0 items-center gap-1.5'>
					<Button
						variant='outline'
						size='icon-sm'
						disabled={isEmpty}
						onClick={onDownload}
						aria-label={t('common.download_image')}
						title={t('common.download_image')}
						className='size-8 rounded-xl'
					>
						<Download className='size-3.5' />
					</Button>
					<Button
						variant='outline'
						size='sm'
						disabled={isEmpty}
						onClick={onCopy}
						className='h-8 gap-1.5 rounded-xl px-3'
					>
						<ClipboardCopy className='size-4' />
						{t('plan_board.copy')}
					</Button>
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
							className='ml-auto size-8 rounded-xl'
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
							{t(view === 'card' ? 'tables.view_compact' : 'tables.view_card')}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem disabled={isEmpty} onSelect={onCopy}>
							<ClipboardCopy />
							{t('plan_board.copy')}
						</DropdownMenuItem>
						<DropdownMenuItem disabled={isEmpty} onSelect={onDownload}>
							<Download />
							{t('common.download_image')}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	)
}
