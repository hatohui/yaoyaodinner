import { useHealth } from '@/hooks/useHealth'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/config/theme'
import HealthErrorView from './HealthErrorView'

const HealthPage = () => {
	const { data, isLoading, error } = useHealth()
	const [theme, toggleTheme] = useTheme()

	if (isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
			</div>
		)
	}

	if (error) {
		return <HealthErrorView error={error} />
	}

	const isHealthy = data?.status === 'ok'
	const isDatabaseHealthy = data?.services?.database?.status === 'healthy'
	const isRedisHealthy = data?.services?.redis?.status === 'healthy'

	return (
		<div className='min-h-screen bg-background p-4 md:p-8'>
			<div className='mx-auto max-w-4xl space-y-8'>
				{/* Header */}
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-4xl font-bold tracking-tight'>System Health</h1>
						<p className='mt-2 text-muted-foreground'>
							Monitor the status of all system services
						</p>
					</div>
					<button
						onClick={toggleTheme}
						className='rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors'
					>
						{theme === 'light' ? '🌙 Dark' : '☀️ Light'}
					</button>
				</div>

				{/* Overall Status Card */}
				<Card className={isHealthy ? 'border-primary' : 'border-destructive'}>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle className='text-2xl'>Overall System Status</CardTitle>
							<Badge
								variant={isHealthy ? 'default' : 'destructive'}
								className='text-base px-4 py-1'
							>
								{isHealthy ? '✓ Healthy' : '✗ Unhealthy'}
							</Badge>
						</div>
						<CardDescription>
							{isHealthy
								? 'All systems are operational'
								: 'One or more services are experiencing issues'}
						</CardDescription>
					</CardHeader>
				</Card>

				{/* Services Grid */}
				<div className='grid gap-6 md:grid-cols-2'>
					{/* Database Status */}
					<Card
						className={
							isDatabaseHealthy
								? 'border-primary/50 hover:border-primary transition-colors'
								: 'border-destructive/50 hover:border-destructive transition-colors'
						}
					>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<div
										className={`h-3 w-3 rounded-full ${isDatabaseHealthy ? 'bg-primary animate-pulse' : 'bg-destructive'}`}
									></div>
									<CardTitle>Database</CardTitle>
								</div>
								<Badge
									variant={isDatabaseHealthy ? 'default' : 'destructive'}
									className='text-sm'
								>
									{isDatabaseHealthy ? 'Healthy' : 'Unhealthy'}
								</Badge>
							</div>
							<CardDescription>PostgreSQL Connection</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='space-y-2'>
								<div className='flex justify-between text-sm'>
									<span className='text-muted-foreground'>Status:</span>
									<span
										className={`font-medium ${isDatabaseHealthy ? 'text-primary' : 'text-destructive'}`}
									>
										{data?.services?.database?.status || 'Unknown'}
									</span>
								</div>
								<div className='flex justify-between text-sm'>
									<span className='text-muted-foreground'>Service:</span>
									<span className='font-medium'>PostgreSQL</span>
								</div>
								<div className='flex justify-between text-sm'>
									<span className='text-muted-foreground'>Connection:</span>
									<span className='font-medium'>
										{isDatabaseHealthy ? 'Active' : 'Failed'}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Redis Status */}
					<Card
						className={
							isRedisHealthy
								? 'border-primary/50 hover:border-primary transition-colors'
								: 'border-destructive/50 hover:border-destructive transition-colors'
						}
					>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<div
										className={`h-3 w-3 rounded-full ${isRedisHealthy ? 'bg-primary animate-pulse' : 'bg-destructive'}`}
									></div>
									<CardTitle>Redis</CardTitle>
								</div>
								<Badge
									variant={isRedisHealthy ? 'default' : 'destructive'}
									className='text-sm'
								>
									{isRedisHealthy ? 'Healthy' : 'Unhealthy'}
								</Badge>
							</div>
							<CardDescription>Cache & Session Store</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='space-y-2'>
								<div className='flex justify-between text-sm'>
									<span className='text-muted-foreground'>Status:</span>
									<span
										className={`font-medium ${isRedisHealthy ? 'text-primary' : 'text-destructive'}`}
									>
										{data?.services?.redis?.status || 'Unknown'}
									</span>
								</div>
								<div className='flex justify-between text-sm'>
									<span className='text-muted-foreground'>Service:</span>
									<span className='font-medium'>Redis</span>
								</div>
								<div className='flex justify-between text-sm'>
									<span className='text-muted-foreground'>Connection:</span>
									<span className='font-medium'>
										{isRedisHealthy ? 'Active' : 'Failed'}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* System Info */}
				<Card>
					<CardHeader>
						<CardTitle>System Information</CardTitle>
						<CardDescription>Additional service details</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid gap-4 md:grid-cols-2'>
							<div className='space-y-2'>
								<p className='text-sm font-medium text-muted-foreground'>
									Services Monitored
								</p>
								<p className='text-2xl font-bold'>2</p>
							</div>
							<div className='space-y-2'>
								<p className='text-sm font-medium text-muted-foreground'>
									Healthy Services
								</p>
								<p className='text-2xl font-bold'>
									{[isDatabaseHealthy, isRedisHealthy].filter(Boolean).length}
								</p>
							</div>
							<div className='space-y-2'>
								<p className='text-sm font-medium text-muted-foreground'>
									Overall Status
								</p>
								<p className='text-lg font-semibold'>
									{data?.status || 'unknown'}
								</p>
							</div>
							<div className='space-y-2'>
								<p className='text-sm font-medium text-muted-foreground'>
									Last Checked
								</p>
								<p className='text-lg font-semibold'>
									{new Date().toLocaleTimeString()}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default HealthPage
