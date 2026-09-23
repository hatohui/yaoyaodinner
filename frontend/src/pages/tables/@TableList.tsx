import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Users, Crown, UserSearch, Image as ImageIcon } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { ASSET_URL } from '@/common/app'
import { cn } from '@/utils/shadcn'

interface TableListProps {
	tables: TableDto[]
}

export function TableList({ tables }: TableListProps) {
	const { t } = useTranslation()

	return (
		<ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
			{tables.map(table => {
				const full = table.seated >= table.capacity
				// the host is already named above, so don't repeat it as a match
				const matched = (table.matchedPeople ?? []).filter(
					name => name !== table.tableLeaderName
				)
				return (
					<li key={table.id}>
						<Link
							to={`/tables/${table.id}`}
							className='flex h-full flex-col gap-2 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
						>
							{table.bannerUrl ? (
								<img
									src={`${ASSET_URL}/${table.bannerUrl}`}
									alt=''
									className='h-20 w-full object-cover'
								/>
							) : (
								<div className='flex h-20 w-full items-center justify-center bg-gradient-to-br from-brand-muted to-muted'>
									<ImageIcon className='size-6 text-muted-foreground/50' />
								</div>
							)}

							<div className='flex flex-1 flex-col gap-2 px-4 pb-3.5 pt-3.5'>
								<div className='flex items-center justify-between gap-2'>
									<span className='flex min-w-0 items-center gap-2'>
										<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground'>
											{table.no}
										</span>
										<span className='truncate font-medium text-foreground'>
											{table.name}
										</span>
									</span>
									<span
										className={cn(
											'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
											full
												? 'bg-muted text-muted-foreground'
												: 'bg-brand-muted text-primary'
										)}
									>
										<Users className='size-3.5' />
										{table.seated}/{table.capacity}
									</span>
								</div>

								<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
									{table.tableLeaderName ? (
										<>
											<Crown className='size-3.5 shrink-0 text-primary' />
											<span className='truncate'>{table.tableLeaderName}</span>
										</>
									) : (
										<span>{t('tables.no_host')}</span>
									)}
									{full && (
										<span className='ml-auto shrink-0'>{t('tables.full')}</span>
									)}
								</div>

								{matched.length > 0 && (
									<p className='flex items-center gap-1.5 rounded-xl bg-brand-muted px-2 py-1 text-xs text-primary'>
										<UserSearch className='size-3.5 shrink-0' />
										<span className='truncate'>{matched.join(', ')}</span>
									</p>
								)}
							</div>
						</Link>
					</li>
				)
			})}
		</ul>
	)
}
