import { useTranslation } from 'react-i18next'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorViewProps {
	error: Error
	onRetry?: () => void
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
	const { t } = useTranslation()

	return (
		<div className='mx-auto my-12 flex max-w-md flex-col items-center justify-center rounded-3xl border border-border bg-card/95 px-6 py-12 text-center shadow-sm backdrop-blur-md'>
			<div className='mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10'>
				<AlertCircle className='h-12 w-12 text-destructive' />
			</div>
			<h3 className='mb-2 text-xl font-semibold'>{t('menu.error_title')}</h3>
			<p className='mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground'>
				{t(`errors.${error.message}`, { defaultValue: t('menu.error_desc') })}
			</p>
			{onRetry && (
				<Button
					onClick={onRetry}
					className='gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90'
				>
					<RefreshCw className='h-4 w-4' />
					{t('menu.try_again')}
				</Button>
			)}
		</div>
	)
}
