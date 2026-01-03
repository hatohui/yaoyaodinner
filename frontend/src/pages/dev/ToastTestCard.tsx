import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

const ToastTestCard = () => {
	const { t } = useTranslation()

	const testToasts = [
		{
			label: t('dev.toast_test.success'),
			action: () =>
				toast.success(t('dev.toast_test.success_message'), {
					description: t('dev.toast_test.success_description'),
				}),
			variant: 'default' as const,
		},
		{
			label: t('dev.toast_test.error'),
			action: () =>
				toast.error(t('dev.toast_test.error_message'), {
					description: t('dev.toast_test.error_description'),
				}),
			variant: 'destructive' as const,
		},
		{
			label: t('dev.toast_test.info'),
			action: () =>
				toast.info(t('dev.toast_test.info_message'), {
					description: t('dev.toast_test.info_description'),
				}),
			variant: 'secondary' as const,
		},
		{
			label: t('dev.toast_test.warning'),
			action: () =>
				toast.warning(t('dev.toast_test.warning_message'), {
					description: t('dev.toast_test.warning_description'),
				}),
			variant: 'outline' as const,
		},
		{
			label: t('dev.toast_test.promise'),
			action: () =>
				toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
					loading: t('dev.toast_test.promise_loading'),
					success: t('dev.toast_test.promise_success'),
					error: t('dev.toast_test.promise_error'),
				}),
			variant: 'default' as const,
		},
		{
			label: t('dev.toast_test.with_action'),
			action: () =>
				toast(t('dev.toast_test.event_created'), {
					description: t('dev.toast_test.undo_description'),
					action: {
						label: t('dev.toast_test.undo'),
						onClick: () => toast.info(t('dev.toast_test.action_undone')),
					},
				}),
			variant: 'default' as const,
		},
	]

	return (
		<Card className='md:col-span-2'>
			<CardHeader>
				<CardTitle>{t('dev.toast_test.title')}</CardTitle>
				<CardDescription>{t('dev.toast_test.description')}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
					{testToasts.map(({ label, action, variant }) => (
						<Button
							key={label}
							onClick={action}
							variant={variant}
							className='w-full'
						>
							{label}
						</Button>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

export default ToastTestCard
