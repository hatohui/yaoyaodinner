import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

interface DeleteFeedbackButtonProps {
	onDelete: () => void
}

export function DeleteFeedbackButton({ onDelete }: DeleteFeedbackButtonProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				aria-label={t('feedback.delete')}
				title={t('feedback.delete')}
				className='flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
			>
				<Trash2 className='size-3.5' />
			</button>
			<ConfirmDialog
				open={open}
				onOpenChange={setOpen}
				title={t('feedback.delete_title')}
				description={t('feedback.delete_desc')}
				confirmLabel={t('feedback.delete')}
				onConfirm={onDelete}
			/>
		</>
	)
}
