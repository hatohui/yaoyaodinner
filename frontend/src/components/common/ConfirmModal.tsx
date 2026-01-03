import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTranslation } from 'react-i18next'

interface ConfirmModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	title: string
	description: string
	confirmText?: string
	cancelText?: string
}

export const ConfirmModal = ({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
	confirmText,
	cancelText,
}: ConfirmModalProps) => {
	const { t } = useTranslation()

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{cancelText || t('cancel')}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						{confirmText || t('confirm')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
