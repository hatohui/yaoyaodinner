import { useTranslation } from 'react-i18next'
import { Pie, PieChart, Cell } from 'recharts'
import type { PopularItemDto } from '@/api/model'
import { Spinner } from '@/components/ui/spinner'
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'

interface PopularItemsChartProps {
	items: PopularItemDto[]
	isLoading: boolean
}

export function PopularItemsChart({
	items,
	isLoading,
}: PopularItemsChartProps) {
	const { t } = useTranslation()

	if (isLoading) {
		return (
			<div className='flex justify-center py-10'>
				<Spinner />
			</div>
		)
	}

	if (items.length === 0) {
		return (
			<p className='py-6 text-center text-sm text-muted-foreground'>
				{t('admin.stats.popular_empty')}
			</p>
		)
	}

	const chartData = items.map((item, index) => ({
		name: item.name,
		count: item.count,
		fill: `var(--chart-${(index % 5) + 1})`,
	}))

	const chartConfig = items.reduce((acc, item, index) => {
		acc[item.name] = {
			label: item.name,
			color: `var(--chart-${(index % 5) + 1})`,
		}
		return acc
	}, { count: { label: 'Orders' } } as ChartConfig)

	return (
		<div className='flex min-h-[300px] w-full items-center justify-center rounded-2xl border border-border/60 bg-card p-4 shadow-sm'>
			<ChartContainer config={chartConfig} className='aspect-square w-full max-w-[300px]'>
				<PieChart>
					<ChartTooltip
						cursor={false}
						content={<ChartTooltipContent hideLabel />}
					/>
					<Pie
						data={chartData}
						dataKey='count'
						nameKey='name'
						innerRadius={60}
						outerRadius={100}
						paddingAngle={2}
					>
						{chartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.fill} />
						))}
					</Pie>
				</PieChart>
			</ChartContainer>
		</div>
	)
}
