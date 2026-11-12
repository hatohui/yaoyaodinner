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
				className='inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-destructive/40 bg-card shadow-sm text-destructive transition-colors hover:border-destructive/60 hover:bg-destructive/20'
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
