import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { InlineEdit } from '@/components/common/InlineEdit'
import { useEditMode } from '@/hooks/useEditMode'
import { useTableEditActions } from '../@useTableEditActions'

export function SeatCountChip({ table }: { table: TableDto }) {
	const { t } = useTranslation()
	const { editing } = useEditMode()
	const { updateCapacity } = useTableEditActions()

	return (
		<span
			title={editing ? t('tables.max_guests') : undefined}
			className='flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium tabular-nums text-primary ring-1 ring-inset ring-primary/25'
		>
			<Users className='size-3.5' />
			{table.seated}
			{editing && (
				<>
					{' /'}
					<InlineEdit
						type='number'
						value={String(table.capacity)}
						onCommit={v => {
							const capacity = Number(v)
							if (capacity >= Math.max(table.seated, 1))
								updateCapacity(table.id, capacity)
						}}
						inputClassName='h-5 w-10 rounded-full border-solid border-border bg-card px-1 py-0 text-xs font-semibold shadow-none'
					/>
				</>
			)}
		</span>
	)
}
