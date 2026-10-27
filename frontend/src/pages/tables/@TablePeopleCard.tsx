import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Crown } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { TruncatedText } from '@/components/common/TruncatedText'
import { cn } from '@/utils/shadcn'
import { tableCardClass } from './@tableCardUtils'

interface TablePeopleCardProps {
	table: TableDto
	isMine: boolean
}

export function TablePeopleCard({ table, isMine }: TablePeopleCardProps) {
	const { t } = useTranslation()
	const matched = new Set(table.matchedPeople ?? [])
	const names = [...(table.seatedNames ?? [])].sort(
		(a, b) =>
			Number(b === table.tableLeaderName) - Number(a === table.tableLeaderName)
	)

	return (
		<Link to={`/tables/${table.id}`} className={tableCardClass(isMine)}>
			<div className='flex flex-1 flex-col gap-2.5 p-3'>
				<div className='flex items-center justify-between gap-2'>
					<span className='flex min-w-0 items-center gap-2'>
						<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground shadow-sm'>
							{table.no}
						</span>
						<TruncatedText
							text={table.name}
							className='text-sm font-semibold text-foreground'
						/>
					</span>
					<span className='shrink-0 text-xs text-muted-foreground'>
						{table.seated}/{table.capacity}
					</span>
				</div>

				{names.length === 0 ? (
					<p className='text-xs text-muted-foreground'>
						{t('tables.nobody_seated')}
					</p>
				) : (
					<ul className='flex flex-wrap gap-1.5'>
						{names.map((name, i) => {
							const isHost = name === table.tableLeaderName
							return (
								<li
									key={`${name}-${i}`}
									className={cn(
										'flex max-w-full items-center gap-1 rounded-full border border-border bg-control px-2 py-0.5 text-xs text-foreground',
										isHost && 'border-primary/40 bg-primary/10',
										matched.has(name) &&
											'border-primary bg-primary/20 text-primary'
									)}
								>
									{isHost && <Crown className='size-3 shrink-0 text-primary' />}
									<span className='truncate'>{name}</span>
								</li>
							)
						})}
					</ul>
				)}
			</div>
		</Link>
	)
}
