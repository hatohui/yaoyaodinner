import { useTranslation } from 'react-i18next'
import { Crown, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router'
import type { TableDto } from '@/api/model'
import { StoredImage } from '@/components/common/StoredImage'
import { TruncatedText } from '@/components/common/TruncatedText'
import {
	defaultBannerSrc,
	matchedPeople,
	tableCardClass,
} from './@tableCardUtils'
import { MatchedPeople } from './@MatchedPeople'
import { OrderTotalChip } from './@OrderTotalChip'

const bannerClass =
	'size-full object-cover transition-transform duration-500 group-hover:scale-105'

interface TableCardProps {
	table: TableDto
	isMine: boolean
	showTotal?: boolean
}

export function TableCard({ table, isMine, showTotal }: TableCardProps) {
	const { t } = useTranslation()

	return (
		<Link to={`/tables/${table.id}`} className={tableCardClass(isMine)}>
			<div className='relative h-28 w-full overflow-hidden sm:h-32'>
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
				<span className='absolute bottom-2 left-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-card/90 px-2.5 text-sm font-bold tabular-nums text-foreground shadow backdrop-blur-sm'>
					{table.no}
				</span>

				{isMine && (
					<span className='absolute left-2 top-2 flex items-center gap-1 rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-primary shadow'>
						<MapPin className='size-3.5 fill-current' />
						{t('tables.your_table')}
					</span>
				)}
				{showTotal && (
					<OrderTotalChip table={table} className='absolute bottom-2 right-2' />
				)}
			</div>

			<div className='flex flex-1 flex-col gap-3 px-4 pb-3 pt-3.5'>
				<TruncatedText
					text={table.name}
					className='text-lg font-bold tracking-tight text-foreground'
				/>

				<MatchedPeople names={matchedPeople(table)} />

				<div className='mt-auto flex items-center justify-between gap-3 border-t border-border pt-2.5 text-xs'>
					<span className='flex min-w-0 items-center gap-1.5'>
						<Crown className='size-3.5 shrink-0 text-primary' />
						{table.tableLeaderName ? (
							<TruncatedText
								text={table.tableLeaderName}
								className='font-medium text-foreground/80'
							/>
						) : (
							<span className='truncate text-muted-foreground'>
								{t('tables.no_host')}
							</span>
						)}
					</span>
					<span
						aria-label={t('split.people_count', { count: table.seated })}
						className='flex shrink-0 items-center gap-1 font-semibold tabular-nums text-foreground'
					>
						<Users className='size-3.5 text-primary' />
						{table.seated}
					</span>
				</div>
			</div>
		</Link>
	)
}
