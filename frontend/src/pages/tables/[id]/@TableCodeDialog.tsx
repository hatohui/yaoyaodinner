import { useTranslation } from 'react-i18next'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { TableCodeForm } from '@/components/common/TableCodeForm'

interface TableCodeDialogProps {
	tableId: string
	open: boolean
	onOpenChange: (open: boolean) => void
	onUnlock: () => void
}

export function TableCodeDialog({
	tableId,
	open,
	onOpenChange,
	onUnlock,
}: TableCodeDialogProps) {
	const { t } = useTranslation()

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='rounded-3xl sm:max-w-sm'>
				<DialogHeader className='items-center text-center'>
					<DialogTitle>{t('table_code.title')}</DialogTitle>
					<DialogDescription>{t('table_code.subtitle')}</DialogDescription>
				</DialogHeader>
				<TableCodeForm tableId={tableId} autoFocus onUnlock={onUnlock} />
			</DialogContent>
		</Dialog>
	)
}
