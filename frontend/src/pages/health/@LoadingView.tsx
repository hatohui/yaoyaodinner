import { useTranslation } from 'react-i18next'

const LoadingView = () => {
	const { t } = useTranslation()

	return (
		<div className='flex min-h-screen items-center justify-center'>
			<div className='text-center space-y-4'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
				<p className='text-muted-foreground'>{t('health.loading')}</p>
			</div>
		</div>
	)
}

export default LoadingView
