import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DoorOpen } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useHeldTableCode } from '@/hooks/useTableCode'
import { useToast } from '@/hooks/useToast'

export function LeaveTableButton() {
	const { t } = useTranslation()
	const toast = useToast()
	const release = useHeldTableCode(s => s.release)
	const [confirming, setConfirming] = useState(false)

	return (
		<>
			<button
				type='button'
				onClick={() => setConfirming(true)}
				aria-label={t('table_code.leave')}
				title={t('table_code.leave')}
				className='inline-flex cursor-pointer items-center rounded-full border border-destructive/40 bg-destructive/10 p-2 text-destructive transition-colors hover:border-destructive/60 hover:bg-destructive/20'
			>
				<DoorOpen className='size-4' />
			</button>

			<ConfirmDialog
				open={confirming}
				onOpenChange={setConfirming}
				title={t('table_code.leave_confirm_title')}
				description={t('table_code.leave_confirm_body')}
				confirmLabel={t('table_code.leave')}
				destructive
				onConfirm={() => {
					release()
					setConfirming(false)
					toast.success(t('table_code.left'))
				}}
			/>
		</>
	)
}
