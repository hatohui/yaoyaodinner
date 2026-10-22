import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TabEmptyStateProps {
	message: string
	tableId: string
	canEdit: boolean
}

export function TabEmptyState({
	message,
	tableId,
	canEdit,
}: TabEmptyStateProps) {
	const { t } = useTranslation()

	return (
		<div className='flex flex-col items-center gap-3 py-10 text-center'>
			<p className='text-sm text-muted-foreground'>{message}</p>
			{canEdit && (
				<Button asChild className='gap-1.5 rounded-full'>
					<Link to={`/tables/${tableId}/order`}>
						<Plus className='size-4' />
						{t('orders.add_order')}
					</Link>
				</Button>
			)}
		</div>
	)
}
