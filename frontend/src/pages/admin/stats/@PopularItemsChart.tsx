import { useTranslation } from 'react-i18next'
import { Pie, PieChart, Cell, Label } from 'recharts'
import type { PopularItemDto } from '@/api/model'
import { Spinner } from '@/components/ui/spinner'
import {
	type ChartConfig,
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
			<div className='flex items-center justify-center rounded-2xl border border-border/60 bg-card p-6 shadow-sm'>
				<Spinner />
			</div>
		)
	}

	if (items.length === 0) {
		return (
			<div className='flex items-center justify-center rounded-2xl border border-border/60 bg-card p-6 shadow-sm'>
				<p className='text-center text-sm text-muted-foreground'>
					{t('admin.stats.popular_empty')}
				</p>
			</div>
		)
	}

	const totalCount = items.reduce((sum, item) => sum + item.count, 0)

	const chartData = items.map((item, index) => ({
		name: item.name,
		count: item.count,
		fill: `var(--chart-${(index % 5) + 1})`,
	}))

	const chartConfig = items.reduce(
		(acc, item, index) => {
			acc[item.name] = {
				label: item.name,
				color: `var(--chart-${(index % 5) + 1})`,
			}
			return acc
		},
		{ count: { label: 'Orders' } } as ChartConfig
	)

	const topLegend = chartData.slice(0, 5)

	return (
		<div className='flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm'>
			<ChartContainer
				config={chartConfig}
				className='mx-auto aspect-square w-full max-w-[200px]'
			>
				<PieChart>
					<ChartTooltip
						cursor={false}
						content={<ChartTooltipContent hideLabel />}
					/>
					<Pie
						data={chartData}
						dataKey='count'
						nameKey='name'
						innerRadius={54}
						outerRadius={84}
						paddingAngle={2}
					>
						{chartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.fill} />
						))}
						<Label
							content={({ viewBox }) => {
								if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
									return (
										<text
											x={viewBox.cx}
											y={viewBox.cy}
											textAnchor='middle'
											dominantBaseline='middle'
										>
											<tspan
												x={viewBox.cx}
												y={viewBox.cy}
												className='fill-foreground text-xl font-bold'
											>
												{totalCount}
											</tspan>
											<tspan
												x={viewBox.cx}
												y={(viewBox.cy || 0) + 18}
												className='fill-muted-foreground text-[11px]'
											>
												{t('admin.dashboard.stat_orders')}
											</tspan>
										</text>
									)
								}
							}}
						/>
					</Pie>
				</PieChart>
			</ChartContainer>

			<ul className='flex flex-col gap-1.5 border-t border-border/50 pt-3 text-xs'>
				{topLegend.map((item, idx) => {
					const pct =
						totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
					return (
						<li
							key={`${item.name}-${idx}`}
							className='flex items-center justify-between gap-2'
						>
							<span className='flex min-w-0 items-center gap-2'>
								<span
									className='size-2.5 shrink-0 rounded-full'
									style={{ backgroundColor: item.fill }}
								/>
								<span className='truncate text-foreground'>{item.name}</span>
							</span>
							<span className='shrink-0 tabular-nums text-muted-foreground'>
								{item.count} ({pct}%)
							</span>
						</li>
					)
				})}
			</ul>
		</div>
	)
}
