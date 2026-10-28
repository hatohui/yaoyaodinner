import { useTranslation } from 'react-i18next'
import {
	Bar,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Cell,
	ReferenceLine,
} from 'recharts'
import type { TableTotalDto } from '@/api/model'
import { Spinner } from '@/components/ui/spinner'
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'

interface TableTotalsChartProps {
	totals: TableTotalDto[]
	isLoading: boolean
}

export function TableTotalsChart({ totals, isLoading }: TableTotalsChartProps) {
	const { t } = useTranslation()

	if (isLoading) {
		return (
			<div className='flex justify-center py-10'>
				<Spinner />
			</div>
		)
	}

	if (totals.length === 0) {
		return (
			<p className='py-6 text-center text-sm text-muted-foreground'>
				{t('admin.stats.totals_empty')}
			</p>
		)
	}

	const active = totals.filter(r => r.total > 0)
	const avg =
		active.length > 0
			? active.reduce((sum, r) => sum + r.total, 0) / active.length
			: 0

	const chartConfig = {
		total: {
			label: 'Total',
			color: 'var(--primary)',
		},
		outlier: {
			label: t('admin.stats.outlier'),
			color: 'var(--destructive)',
		},
	} satisfies ChartConfig

	return (
		<div className='flex w-full flex-col justify-center gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm'>
			<ChartContainer config={chartConfig} className='aspect-auto h-52 w-full'>
				<BarChart
					data={totals}
					margin={{ top: 12, left: 4, right: 12, bottom: 0 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey='name'
						tickLine={false}
						tickMargin={8}
						axisLine={false}
						fontSize={12}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						width={64}
						fontSize={12}
						tickFormatter={value => `${value} RM`}
					/>
					{avg > 0 && (
						<ReferenceLine
							y={avg}
							stroke='var(--muted-foreground)'
							strokeDasharray='4 4'
							strokeOpacity={0.6}
						/>
					)}
					<ChartTooltip
						cursor={false}
						content={
							<ChartTooltipContent
								labelFormatter={(_label, payload) => {
									const row = payload?.[0]?.payload as TableTotalDto | undefined
									return row ? `#${row.no} · ${row.name}` : _label
								}}
								formatter={value => (
									<div className='flex flex-1 items-center justify-between gap-3 leading-none'>
										<span className='text-muted-foreground'>
											{t('orders.total')}
										</span>
										<span className='font-mono font-semibold tabular-nums text-foreground'>
											{Number(value).toFixed(2)} RM
										</span>
									</div>
								)}
							/>
						}
					/>
					<Bar dataKey='total' radius={8} maxBarSize={44}>
						{totals.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={
									entry.isOutlier
										? 'var(--color-outlier)'
										: 'var(--color-total)'
								}
							/>
						))}
					</Bar>
				</BarChart>
			</ChartContainer>
		</div>
	)
}
