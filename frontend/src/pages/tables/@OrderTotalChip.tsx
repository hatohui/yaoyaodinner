import { useTranslation } from 'react-i18next'
import { ReceiptText } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { cn } from '@/utils/shadcn'

export function OrderTotalChip({
	table,
	className,
}: {
	table: TableDto
	className?: string
}) {
	const { t } = useTranslation()
	const total = table.orderTotal ?? 0

	return (
		<span
			className={cn(
				'flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums shadow',
				total > 0
					? 'bg-primary text-primary-foreground'
					: 'bg-card text-muted-foreground',
				className
			)}
		>
			<ReceiptText className='size-3.5' />
			{total > 0
				? `${total.toFixed(2)} ${table.currency ?? ''}`.trim()
				: t('split.empty')}
		</span>
	)
}
