import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

interface OverallStatusCardProps {
	isHealthy: boolean
}

const OverallStatusCard = ({ isHealthy }: OverallStatusCardProps) => {
	const { t } = useTranslation()

	return (
		<Card className={isHealthy ? 'border-primary' : 'border-destructive'}>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='text-2xl'>
						{t('health.overall_status')}
					</CardTitle>
					<Badge
						variant={isHealthy ? 'default' : 'destructive'}
						className='text-base px-4 py-1'
					>
						{isHealthy
							? `✓ ${t('health.healthy')}`
							: `✗ ${t('health.unhealthy')}`}
					</Badge>
				</div>
				<CardDescription>
					{isHealthy
						? t('health.all_operational')
						: t('health.issues_detected')}
				</CardDescription>
			</CardHeader>
		</Card>
	)
}

export default OverallStatusCard
