import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Users, Crown } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { StoredImage } from '@/components/common/StoredImage'
import { TruncatedText } from '@/components/common/TruncatedText'
import { cn } from '@/utils/shadcn'
import { matchedPeople, tableCardClass } from './@tableCardUtils'
import { MatchedPeople } from './@MatchedPeople'
import { OrderTotalChip } from './@OrderTotalChip'

interface TableCompactCardProps {
	table: TableDto
	isMine: boolean
	showTotal?: boolean
}

export function TableCompactCard({
	table,
	isMine,
	showTotal,
}: TableCompactCardProps) {
	const { t } = useTranslation()
	const chip =
		table.bannerUrl && 'rounded-full bg-card px-2.5 py-0.5 shadow-sm ring-1 ring-inset ring-border'

	return (
		<Link to={`/tables/${table.id}`} className={tableCardClass(isMine)}>
			{table.bannerUrl && (
				<>
					<StoredImage
						imageKey={table.bannerUrl}
						className='absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105'
					/>
					<span className='absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/30' />
				</>
			)}

			<div className='relative flex flex-1 flex-col gap-2 p-3'>
				<span className='flex min-w-0 items-center gap-2'>
					<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground shadow-sm'>
						{table.no}
					</span>
					<TruncatedText
						text={table.name}
						className='text-sm font-medium text-foreground'
					/>
				</span>
				<div className='flex items-center justify-between gap-1.5'>
					<span
						className={cn(
							'flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary ring-1 ring-inset ring-primary/25',
							table.bannerUrl && 'bg-card shadow-sm ring-primary/30'
						)}
					>
						<Users className='size-3 shrink-0' />
						{table.seated}
					</span>
					{table.tableLeaderName ? (
						<span
							className={cn(
								'flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground',
								chip,
								table.bannerUrl && 'text-foreground'
							)}
						>
							<Crown className='size-3 shrink-0 text-primary' />
							<TruncatedText text={table.tableLeaderName} />
						</span>
					) : (
						<span
							className={cn('truncate text-[11px] text-muted-foreground', chip)}
						>
							{t('tables.no_host')}
						</span>
					)}
				</div>

				{showTotal && <OrderTotalChip table={table} />}

				<MatchedPeople names={matchedPeople(table)} />
			</div>
		</Link>
	)
}
