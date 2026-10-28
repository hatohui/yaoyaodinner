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
			<div className='relative aspect-[16/9] w-full overflow-hidden border-b border-border'>
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
				<span className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent ring-1 ring-inset ring-black/10 dark:ring-white/15' />
				<span className='absolute bottom-2.5 left-2.5 flex h-8 min-w-8 items-center justify-center rounded-full border border-border/80 bg-card/95 px-2.5 text-sm font-bold tabular-nums text-foreground shadow-md backdrop-blur-sm'>
					{table.no}
				</span>

				{isMine && (
					<span className='absolute left-2 top-2 flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-xs font-semibold text-primary shadow'>
						<MapPin className='size-3.5 fill-current' />
						{t('tables.your_table')}
					</span>
				)}
				{showTotal && (
					<OrderTotalChip table={table} className='absolute bottom-2 right-2' />
				)}
			</div>

			<div className='flex flex-1 flex-col gap-3 px-4 pb-4 pt-3.5'>
				<TruncatedText
					text={table.name}
					className='text-base font-bold leading-tight tracking-tight text-foreground sm:text-lg'
				/>

				<MatchedPeople names={matchedPeople(table)} />

				<div className='mt-auto flex items-center justify-between gap-3 border-t border-border/50 pt-3 text-sm'>
					<span className='flex min-w-0 items-center gap-1.5'>
						<Crown className='size-4 shrink-0 text-primary' />
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
						className='flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary'
					>
						<Users className='size-3.5' />
						{table.seated}
					</span>
				</div>
			</div>
		</Link>
	)
}
