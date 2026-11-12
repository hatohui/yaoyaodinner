import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Flame, Sparkles, Users } from 'lucide-react'
import { useGetAiUsage } from '@/api/tables/tables'
import type { AiUsageDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { relativeTime } from '@/utils/relativeTime'
import { cn } from '@/utils/shadcn'

export function AiUsageDialog({ className }: { className?: string }) {
	const { t, i18n } = useTranslation()
	const [open, setOpen] = useState(false)
	const { data, isLoading, isError } = useGetAiUsage<AiUsageDto[]>({
		query: { enabled: open, refetchOnMount: 'always' },
	})
	const top = data?.[0]?.total ?? 0
	const total = data?.reduce((sum, row) => sum + row.total, 0) ?? 0

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size='sm'
					variant='outline'
					className={cn('gap-1.5 rounded-full', className)}
				>
					<Bot className='size-4' />
					{t('ai_usage.open')}
				</Button>
			</DialogTrigger>
			<DialogContent className='flex max-h-[85vh] flex-col rounded-3xl sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{t('ai_usage.title')}</DialogTitle>
					<DialogDescription>{t('ai_usage.description')}</DialogDescription>
				</DialogHeader>
				{isLoading ? (
					<div className='flex justify-center py-6'>
						<Spinner />
					</div>
				) : isError ? (
					<p className='py-6 text-center text-sm text-muted-foreground'>
						{t('ai_usage.load_error')}
					</p>
				) : !data?.length ? (
					<p className='py-6 text-center text-sm text-muted-foreground'>
						{t('ai_usage.empty')}
					</p>
				) : (
					<>
						<p className='text-sm font-semibold text-foreground'>
							{t('ai_usage.summary', { count: total })}
						</p>
						<ol className='scrollbar-thin -mx-1 flex flex-col gap-1 overflow-y-auto'>
							{data.map((row, index) => (
								<li
									key={row.personId ?? 'admin'}
									className='flex items-start gap-3 rounded-xl px-2 py-2.5'
								>
									<span
										className={cn(
											'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
											index === 0
												? 'bg-primary text-primary-foreground'
												: 'bg-primary/10 text-primary'
										)}
									>
										{index + 1}
									</span>
									<div className='flex min-w-0 flex-1 flex-col gap-1'>
										<div className='flex items-baseline justify-between gap-2'>
											<p className='truncate text-sm font-semibold text-foreground'>
												{row.personId
													? (row.personName ?? t('ai_usage.unknown'))
													: t('ai_usage.admins')}
											</p>
											<span className='shrink-0 text-sm font-semibold text-primary'>
												{t('ai_usage.total', { count: row.total })}
											</span>
										</div>
										<div className='h-1.5 overflow-hidden rounded-full bg-muted'>
											<div
												className='h-full rounded-full bg-primary'
												style={{ width: `${(row.total / top) * 100}%` }}
											/>
										</div>
										<p className='flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground'>
											{row.personId && row.tableNo != null && (
												<span>
													{t('ai_usage.table', {
														no: row.tableNo,
														name: row.tableName ?? '',
													})}
												</span>
											)}
											<span
												className='flex items-center gap-1'
												title={t('ai_usage.table_roasts')}
											>
												<Users className='size-3' />
												{row.tableRoasts}
											</span>
											<span
												className='flex items-center gap-1'
												title={t('ai_usage.guest_roasts')}
											>
												<Flame className='size-3' />
												{row.guestRoasts}
											</span>
											<span
												className='flex items-center gap-1'
												title={t('ai_usage.plans')}
											>
												<Sparkles className='size-3' />
												{row.plans}
											</span>
											<time dateTime={row.lastAt}>
												{t('ai_usage.last', {
													time: relativeTime(row.lastAt, i18n.language),
												})}
											</time>
										</p>
									</div>
								</li>
							))}
						</ol>
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
