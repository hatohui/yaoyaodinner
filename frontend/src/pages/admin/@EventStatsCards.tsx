import { useTranslation } from 'react-i18next'
import { Armchair, Users, ClipboardList, Coins, Calculator } from 'lucide-react'
import type { EventStatsDto } from '@/api/model'
import { Card } from '@/components/ui/card'

interface EventStatsCardsProps {
	stats: EventStatsDto
	totalSpend?: number
	avgPerTable?: number
}

export function EventStatsCards({
	stats,
	totalSpend = 0,
	avgPerTable = 0,
}: EventStatsCardsProps) {
	const { t } = useTranslation()

	const items = [
		{
			key: 'tables',
			label: t('admin.dashboard.stat_tables'),
			value: String(stats.tables),
			icon: Armchair,
		},
		{
			key: 'people',
			label: t('admin.dashboard.stat_people'),
			value: String(stats.people),
			icon: Users,
		},
		{
			key: 'orders',
			label: t('admin.dashboard.stat_orders'),
			value: String(stats.orders),
			icon: ClipboardList,
		},
		{
			key: 'spend',
			label: t('admin.stats.totals_title'),
			value: `${totalSpend.toFixed(2)} RM`,
			icon: Coins,
		},
		{
			key: 'avg',
			label: `Avg / ${t('admin.people.table')}`,
			value: `${avgPerTable.toFixed(2)} RM`,
			icon: Calculator,
		},
	]

	return (
		<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
			{items.map(item => {
				const Icon = item.icon
				return (
					<Card key={item.key} className='gap-1.5 rounded-2xl px-4 py-3.5'>
						<div className='flex items-center gap-1.5 text-muted-foreground'>
							<Icon className='size-3.5 shrink-0 text-primary' />
							<span className='truncate text-[11px] font-medium uppercase tracking-wide'>
								{item.label}
							</span>
						</div>
						<span className='truncate text-xl font-bold tabular-nums text-foreground'>
							{item.value}
						</span>
					</Card>
				)
			})}
		</div>
	)
}
