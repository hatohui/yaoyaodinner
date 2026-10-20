import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft, Lock } from 'lucide-react'
import { TableCodeForm } from '@/components/common/TableCodeForm'

export function OrderLocked({ tableId }: { tableId: string }) {
	const { t } = useTranslation()

	return (
		<div className='mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col px-4 py-6'>
			<Link
				to={`/tables/${tableId}`}
				className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
			>
				<ArrowLeft className='size-4' />
				{t('orders.back_to_table')}
			</Link>

			<div className='flex flex-1 flex-col items-center justify-center gap-6 text-center'>
				<div className='flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary'>
					<Lock className='size-6' />
				</div>
				<div className='space-y-1.5'>
					<h1 className='text-2xl font-bold text-foreground'>
						{t('table_code.title')}
					</h1>
					<p className='text-sm text-muted-foreground'>
						{t('table_code.subtitle')}
					</p>
				</div>
				<TableCodeForm tableId={tableId} autoFocus />
			</div>
		</div>
	)
}
