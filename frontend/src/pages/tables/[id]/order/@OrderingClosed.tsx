import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { OrderingClosedNotice } from '@/components/common/OrderingClosedNotice'

export function OrderingClosed({ tableId }: { tableId: string }) {
	const { t } = useTranslation()

	return (
		<div className='mx-auto flex max-w-md flex-col gap-6 px-4 py-6'>
			<Link
				to={`/tables/${tableId}`}
				className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
			>
				<ArrowLeft className='size-4' />
				{t('orders.back_to_table')}
			</Link>
			<OrderingClosedNotice />
		</div>
	)
}
