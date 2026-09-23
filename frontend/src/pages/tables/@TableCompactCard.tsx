import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Users, Crown } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { StoredImage } from '@/components/common/StoredImage'
import { cn } from '@/utils/shadcn'
import { matchedPeople, tableCardClass } from './@tableCardUtils'
import { MatchedPeople } from './@MatchedPeople'

interface TableCompactCardProps {
	table: TableDto
	isMine: boolean
}

export function TableCompactCard({ table, isMine }: TableCompactCardProps) {
	const { t } = useTranslation()
	const full = table.seated >= table.capacity
	const chip =
		table.bannerUrl && 'rounded-full bg-card/90 px-2 py-0.5 backdrop-blur-sm'

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
					<span className='truncate text-sm font-medium text-foreground'>
						{table.name}
					</span>
				</span>
				<div className='flex items-center justify-between gap-1.5'>
					<span
						className={cn(
							'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
							full
								? 'bg-muted text-foreground/75'
								: 'bg-primary/15 text-primary ring-1 ring-inset ring-primary/25',
							table.bannerUrl && 'bg-card/90 backdrop-blur-sm'
						)}
					>
						<Users className='size-3' />
						{table.seated}/{table.capacity}
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
							<span className='truncate'>{table.tableLeaderName}</span>
						</span>
					) : (
						<span
							className={cn('truncate text-[11px] text-muted-foreground', chip)}
						>
							{t('tables.no_host')}
						</span>
					)}
				</div>

				<MatchedPeople names={matchedPeople(table)} />
			</div>
		</Link>
	)
}
