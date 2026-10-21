import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'
import type { TableTotalDto } from '@/api/model'
import { Spinner } from '@/components/ui/spinner'
import {
	ChartConfig,
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

	const chartConfig = {
		total: {
			label: 'Total spent',
			color: 'var(--primary)',
		},
		outlier: {
			label: 'Outlier',
			color: 'var(--destructive)',
		},
	} satisfies ChartConfig

	return (
		<div className='flex min-h-[300px] w-full flex-col justify-center rounded-2xl border border-border/60 bg-card p-4 shadow-sm'>
			<ChartContainer config={chartConfig} className='w-full'>
				<BarChart data={totals} margin={{ top: 20, left: -20, right: 10, bottom: 0 }}>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey='name'
						tickLine={false}
						tickMargin={10}
						axisLine={false}
						fontSize={12}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={10}
						fontSize={12}
						tickFormatter={value => `$${value}`}
					/>
					<ChartTooltip
						cursor={false}
						content={<ChartTooltipContent hideLabel />}
					/>
					<Bar dataKey='total' radius={8}>
						{totals.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={entry.isOutlier ? 'var(--color-outlier)' : 'var(--color-total)'}
							/>
						))}
					</Bar>
				</BarChart>
			</ChartContainer>
		</div>
	)
}
