import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useTranslation } from 'react-i18next'

interface SystemInfoCardProps {
	totalServices: number
	healthyServicesCount: number
	overallStatus: string
}

const SystemInfoCard = ({
	totalServices,
	healthyServicesCount,
	overallStatus,
}: SystemInfoCardProps) => {
	const { t } = useTranslation()

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('health.system_info')}</CardTitle>
				<CardDescription>{t('health.system_info_description')}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='grid gap-4 md:grid-cols-2'>
					<div className='space-y-2'>
						<p className='text-sm font-medium text-muted-foreground'>
							{t('health.services_monitored')}
						</p>
						<p className='text-2xl font-bold'>{totalServices}</p>
					</div>
					<div className='space-y-2'>
						<p className='text-sm font-medium text-muted-foreground'>
							{t('health.healthy_services')}
						</p>
						<p className='text-2xl font-bold'>{healthyServicesCount}</p>
					</div>
					<div className='space-y-2'>
						<p className='text-sm font-medium text-muted-foreground'>
							{t('health.overall_status')}
						</p>
						<p className='text-lg font-semibold'>
							{overallStatus || t('health.unknown')}
						</p>
					</div>
					<div className='space-y-2'>
						<p className='text-sm font-medium text-muted-foreground'>
							{t('health.last_checked')}
						</p>
						<p className='text-lg font-semibold'>
							{new Date().toLocaleTimeString()}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default SystemInfoCard
