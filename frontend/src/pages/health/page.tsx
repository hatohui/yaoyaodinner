import { useHealth } from '@/hooks/useHealth'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { BackButton } from '@/components/common/BackButton'
import { useTranslation } from 'react-i18next'
import LoadingView from './@LoadingView'
import HealthErrorView from './@HealthErrorView'
import OverallStatusCard from './@OverallStatusCard'
import ServiceCard from './@ServiceCard'
import SystemInfoCard from './@SystemInfoCard'

const HealthPage = () => {
	const { t } = useTranslation()
	const { data, isLoading, error } = useHealth()

	if (isLoading) {
		return <LoadingView />
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
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<BackButton />
						<ThemeToggle />
					</div>
					<div>
						<h1 className='text-4xl font-bold tracking-tight text-primary'>
							{t('health.title')}
						</h1>
						<p className='mt-2 text-muted-foreground'>{t('health.subtitle')}</p>
					</div>

					<OverallStatusCard isHealthy={isHealthy} />

					<div className='grid gap-6 md:grid-cols-2'>
						<ServiceCard
							name={t('health.database')}
							description={t('health.database_description')}
							isHealthy={isDatabaseHealthy}
							status={data?.services?.database?.status || ''}
							serviceName='PostgreSQL'
						/>

						<ServiceCard
							name={t('health.redis')}
							description={t('health.redis_description')}
							isHealthy={isRedisHealthy}
							status={data?.services?.redis?.status || ''}
							serviceName='Redis'
						/>
					</div>

					<SystemInfoCard
						totalServices={2}
						healthyServicesCount={
							[isDatabaseHealthy, isRedisHealthy].filter(Boolean).length
						}
						overallStatus={data?.status || ''}
					/>
				</div>
			</div>
		</div>
	)
}

export default HealthPage
