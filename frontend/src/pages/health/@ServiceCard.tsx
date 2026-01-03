import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

interface ServiceCardProps {
	name: string
	description: string
	isHealthy: boolean
	status: string
	serviceName: string
}

const ServiceCard = ({
	name,
	description,
	isHealthy,
	status,
	serviceName,
}: ServiceCardProps) => {
	const { t } = useTranslation()

	return (
		<Card
			className={
				isHealthy
					? 'border-primary/50 hover:border-primary transition-colors'
					: 'border-destructive/50 hover:border-destructive transition-colors'
			}
		>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div
							className={`h-3 w-3 rounded-full ${isHealthy ? 'bg-primary animate-pulse' : 'bg-destructive'}`}
						></div>
						<CardTitle>{name}</CardTitle>
					</div>
					<Badge
						variant={isHealthy ? 'default' : 'destructive'}
						className='text-sm'
					>
						{isHealthy ? t('health.healthy') : t('health.unhealthy')}
					</Badge>
				</div>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='space-y-2'>
					<div className='flex justify-between text-sm'>
						<span className='text-muted-foreground'>{t('health.status')}:</span>
						<span
							className={`font-medium ${isHealthy ? 'text-primary' : 'text-destructive'}`}
						>
							{status || t('health.unknown')}
						</span>
					</div>
					<div className='flex justify-between text-sm'>
						<span className='text-muted-foreground'>
							{t('health.service')}:
						</span>
						<span className='font-medium'>{serviceName}</span>
					</div>
					<div className='flex justify-between text-sm'>
						<span className='text-muted-foreground'>
							{t('health.connection')}:
						</span>
						<span className='font-medium'>
							{isHealthy ? t('health.active') : t('health.failed')}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default ServiceCard
