import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Crown, MapPin } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { StoredImage } from '@/components/common/StoredImage'
import {
	defaultBannerSrc,
	matchedPeople,
	tableCardClass,
} from './@tableCardUtils'
import { MatchedPeople } from './@MatchedPeople'
import { SeatDots } from './@SeatDots'

const bannerClass =
	'size-full object-cover transition-transform duration-500 group-hover:scale-105'

interface TableCardProps {
	table: TableDto
	isMine: boolean
}

export function TableCard({ table, isMine }: TableCardProps) {
	const { t } = useTranslation()
	const full = table.seated >= table.capacity

	return (
		<Link to={`/tables/${table.id}`} className={tableCardClass(isMine)}>
			<div className='relative h-24 w-full overflow-hidden'>
				<StoredImage
					imageKey={table.bannerUrl}
					className={bannerClass}
					fallback={
						<img
							src={defaultBannerSrc(table.no)}
							alt=''
							loading='lazy'
							className={bannerClass}
						/>
					}
				/>
				<span className='absolute bottom-2 left-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-card/90 px-2.5 text-base font-bold tabular-nums text-foreground shadow backdrop-blur-sm'>
					{table.no}
				</span>

				{isMine && (
					<span className='absolute left-2 top-2 flex items-center gap-1 rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-primary shadow'>
						<MapPin className='size-3.5 fill-current' />
						{t('tables.your_table')}
					</span>
				)}
				{full && (
					<span className='absolute right-2 top-2 rounded-full bg-foreground/85 px-2.5 py-0.5 text-xs font-semibold text-background shadow'>
						{t('tables.filter_full')}
					</span>
				)}
			</div>

			<div className='flex flex-1 flex-col gap-2.5 px-4 py-3.5'>
				<span className='truncate font-semibold text-foreground'>
					{table.name}
				</span>

				<div className='flex items-center justify-between gap-2'>
					<SeatDots seated={table.seated} capacity={table.capacity} />
					{table.tableLeaderName ? (
						<span className='flex min-w-0 items-center gap-1 text-xs font-medium text-foreground/80'>
							<Crown className='size-3.5 shrink-0 text-primary' />
							<span className='truncate'>{table.tableLeaderName}</span>
						</span>
					) : (
						<span className='truncate text-xs text-muted-foreground'>
							{t('tables.no_host')}
						</span>
					)}
				</div>

				<MatchedPeople names={matchedPeople(table)} />
			</div>
		</Link>
	)
}
