import { useTranslation } from 'react-i18next'
import type { PopularItemDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

interface AllOrderedDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	items: PopularItemDto[]
	isLoading: boolean
}

export function AllOrderedDialog({
	open,
	onOpenChange,
	items,
	isLoading,
}: AllOrderedDialogProps) {
	const { t } = useTranslation()
	const total = items.reduce((sum, i) => sum + i.count, 0)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[85vh] flex-col sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{t('admin.stats.all_ordered_title')}</DialogTitle>
					{!isLoading && (
						<p className='text-sm text-muted-foreground'>
							{t('admin.stats.all_ordered_summary', {
								items: items.length,
								count: total,
							})}
						</p>
					)}
				</DialogHeader>
				{isLoading ? (
					<div className='flex justify-center py-10'>
						<Spinner />
					</div>
				) : (
					<ol className='-mx-2 flex flex-col overflow-y-auto'>
						{items.map((item, i) => (
							<li
								key={item.variantId}
								className='flex items-center gap-3 rounded-xl px-2 py-2 text-sm odd:bg-muted/40'
							>
								<span className='w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums'>
									{i + 1}
								</span>
								<span className='min-w-0 flex-1 truncate font-medium text-foreground'>
									{item.name}
								</span>
								<span className='shrink-0 font-semibold text-foreground tabular-nums'>
									{item.count}
								</span>
							</li>
						))}
					</ol>
				)}
			</DialogContent>
		</Dialog>
	)
}
