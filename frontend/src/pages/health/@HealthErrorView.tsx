import React from 'react'
import { useTranslation } from 'react-i18next'
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from '@/components/ui/card'

const HealthErrorView = ({ error }: { error: Error }): React.ReactElement => {
	const { t } = useTranslation()

	return (
		<div className='flex min-h-screen items-center justify-center p-4'>
			<Card className='w-full max-w-md border-destructive'>
				<CardHeader>
					<CardTitle className='text-destructive'>
						{t('errors.title')}
					</CardTitle>
					<CardDescription>{t('health.fetch_failed')}</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='text-sm text-muted-foreground'>
						{t(`errors.${error.message}`, {
							defaultValue: t('errors.UNKNOWN_ERROR'),
						})}
					</p>
				</CardContent>
			</Card>
		</div>
	)
}

export default HealthErrorView
