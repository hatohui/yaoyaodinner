import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GripVertical } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SwapDnd } from '@/components/common/SwapDnd'
import { SwapNumberDialog } from '../admin/tables/@SwapNumberDialog'
import { TableAuditDialog } from '../admin/tables/@TableAuditDialog'
import { TableEditCard } from './@TableEditCard'
import { useTableEditActions } from './@useTableEditActions'

interface TableEditGridProps {
	tables: TableDto[]
	className: string
}

export function TableEditGrid({ tables, className }: TableEditGridProps) {
	const { t } = useTranslation()
	const {
		renameTable,
		updateCapacity,
		updateBanner,
		swapNumbers,
		deleteTable,
	} = useTableEditActions()
	const [swapping, setSwapping] = useState<TableDto | null>(null)
	const [deleting, setDeleting] = useState<TableDto | null>(null)

	return (
		<>
			<div className='mb-3 flex items-center justify-between gap-3'>
				<p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
					<GripVertical className='size-3.5 shrink-0' />
					{t('tables.drag_to_swap')}
				</p>
				<TableAuditDialog className='shrink-0' />
			</div>
			<SwapDnd items={tables} onSwap={swapNumbers}>
				<ul className={className}>
					{tables.map(table => (
						<li key={table.id}>
							<TableEditCard
								table={table}
								onRename={name => renameTable(table.id, name)}
								onCapacityChange={capacity =>
									updateCapacity(table.id, capacity)
								}
								onBannerChange={bannerUrl => updateBanner(table.id, bannerUrl)}
								onSwapClick={() => setSwapping(table)}
								onDeleteClick={() => setDeleting(table)}
							/>
						</li>
					))}
				</ul>
			</SwapDnd>

			<SwapNumberDialog
				liveEvent
				table={swapping}
				onOpenChange={open => !open && setSwapping(null)}
				onSwap={([a, b]) => swapNumbers(a, b)}
			/>
			<ConfirmDialog
				open={deleting !== null}
				onOpenChange={open => !open && setDeleting(null)}
				title={t('tables.delete_title', {
					no: deleting?.no,
					name: deleting?.name,
				})}
				description={t('admin.tables.bulk_delete_desc')}
				confirmLabel={t('admin.tables.delete_selected')}
				onConfirm={() => {
					if (deleting) deleteTable(deleting.id)
					setDeleting(null)
				}}
			/>
		</>
	)
}
