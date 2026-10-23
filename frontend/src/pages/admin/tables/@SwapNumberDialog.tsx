import { useTranslation } from 'react-i18next'
import { ArrowLeftRight } from 'lucide-react'
import { useGetStagedTables, useGetTables } from '@/api/tables/tables'
import type { TableDto, TableListDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { useAdminEvents } from '@/hooks/useAdminEvents'

interface SwapNumberDialogProps {
	table: TableDto | null
	onOpenChange: (open: boolean) => void
	onSwap: (ids: string[]) => void
}

export function SwapNumberDialog({
	table,
	onOpenChange,
	onSwap,
}: SwapNumberDialogProps) {
	const { t } = useTranslation()
	const { scopedEventId } = useAdminEvents()
	const open = table !== null
	const staged = table?.isStaging ?? false

	// The live list is paginated, so fetch the whole event to pick from.
	const { data: live, isLoading: liveLoading } = useGetTables<TableListDto>(
		{ count: 100, eventId: scopedEventId },
		{ query: { enabled: open && !staged } }
	)
	const { data: stagedTables = [], isLoading: stagedLoading } =
		useGetStagedTables<TableDto[]>({ query: { enabled: open && staged } })

	const isLoading = staged ? stagedLoading : liveLoading
	const others = (staged ? stagedTables : (live?.tables ?? [])).filter(
		tb => tb.id !== table?.id
	)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[85vh] flex-col rounded-3xl sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{t('admin.tables.swap_title', {
							no: table?.no,
							name: table?.name,
						})}
					</DialogTitle>
					<DialogDescription>{t('admin.tables.swap_desc')}</DialogDescription>
				</DialogHeader>
				{isLoading ? (
					<div className='flex justify-center py-6'>
						<Spinner />
					</div>
				) : others.length === 0 ? (
					<p className='py-4 text-center text-sm text-muted-foreground'>
						{t('admin.tables.empty')}
					</p>
				) : (
					<ul className='scrollbar-thin -mx-1 flex flex-col overflow-y-auto'>
						{others.map(other => (
							<li key={other.id}>
								<button
									type='button'
									onClick={() => {
										if (table) onSwap([table.id, other.id])
										onOpenChange(false)
									}}
									className='group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-muted/50'
								>
									<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
										{other.no}
									</span>
									<span className='min-w-0 flex-1 truncate'>{other.name}</span>
									<ArrowLeftRight className='size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
								</button>
							</li>
						))}
					</ul>
				)}
			</DialogContent>
		</Dialog>
	)
}
