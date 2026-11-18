import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Plus, UtensilsCrossed } from 'lucide-react'
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
		<div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center'>
			<span className='flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
				<UtensilsCrossed className='size-5' />
			</span>
			<p className='text-sm font-medium text-muted-foreground'>{message}</p>
			{canEdit && (
				<Button
					asChild
					size='sm'
					className='h-9 gap-1.5 rounded-xl bg-action px-4 text-action-foreground shadow-md hover:bg-primary hover:text-primary-foreground hover:brightness-100'
				>
					<Link to={`/tables/${tableId}/order`}>
						<Plus className='size-4' />
						{t('orders.add_order')}
					</Link>
				</Button>
			)}
		</div>
	)
}
