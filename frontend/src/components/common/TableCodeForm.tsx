import { useTranslation } from 'react-i18next'
import { DoorOpen } from 'lucide-react'
import { useGetTableById } from '@/api/tables/tables'
import type { TableDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { PinInput } from '@/components/common/PinInput'
import { useHeldTableCode, useTableCodeUnlock } from '@/hooks/useTableCode'

interface TableCodeFormProps {
	tableId: string
	onUnlock?: () => void
	autoFocus?: boolean
}

export function TableCodeForm({
	tableId,
	onUnlock,
	autoFocus,
}: TableCodeFormProps) {
	const { t } = useTranslation()
	const held = useHeldTableCode(s => s.held)
	const release = useHeldTableCode(s => s.release)
	const heldElsewhere = held && held.tableId !== tableId ? held.tableId : null
	const { data: heldTable } = useGetTableById<TableDto>(heldElsewhere ?? '', {
		query: { enabled: Boolean(heldElsewhere) },
	})
	const { code, onChange, submit, invalid, isPending, pinLength } =
		useTableCodeUnlock(tableId, onUnlock)

	if (heldElsewhere) {
		return (
			<div className='flex flex-col items-center gap-4'>
				<p className='text-sm text-foreground'>
					{t('table_code.held_elsewhere', {
						table: heldTable ? `${heldTable.no}. ${heldTable.name}` : '…',
					})}
				</p>
				<Button
					variant='outline'
					className='gap-1.5 rounded-full'
					onClick={release}
				>
					<DoorOpen className='size-4' />
					{t('table_code.leave')}
				</Button>
			</div>
		)
	}

	return (
		<div className='flex flex-col items-center gap-4'>
			<PinInput
				value={code}
				onChange={onChange}
				length={pinLength}
				invalid={invalid}
				autoFocus={autoFocus}
				onComplete={submit}
			/>

			{invalid && (
				<p className='text-sm font-medium text-destructive'>
					{t('table_code.invalid')}
				</p>
			)}

			<Button
				className='w-44 rounded-full'
				disabled={code.length < pinLength || isPending}
				onClick={() => submit(code)}
			>
				{isPending ? t('table_code.unlocking') : t('table_code.unlock')}
			</Button>

			<p className='text-xs text-muted-foreground'>
				{t('table_code.one_at_a_time')}
			</p>
		</div>
	)
}
