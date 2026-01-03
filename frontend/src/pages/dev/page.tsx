import { Separator } from '@/components/ui/separator'
import { BackButton } from '@/components/common/BackButton'
import { useTranslation } from 'react-i18next'
import LanguageTestCard from './@LanguageTestCard'
import LocalStorageTestCard from './@LocalStorageTestCard'
import ThemeTestCard from './@ThemeTestCard'
import ToastTestCard from './@ToastTestCard'

const DevPage = () => {
	const { t } = useTranslation()

	return (
		<div className='min-h-screen bg-background p-4 md:p-8'>
			<div className='mx-auto max-w-6xl space-y-8'>
				{/* Header */}
				<div className='flex items-center justify-between'>
					<div>
						<BackButton />
						<h1 className='text-4xl font-bold text-primary tracking-tight mt-2'>
							{t('dev.title')}
						</h1>
						<p className='mt-2 text-muted-foreground'>{t('dev.subtitle')}</p>
					</div>
				</div>

				<Separator />

				{/* Test Cards Grid */}
				<div className='grid gap-6 md:grid-cols-2'>
					<LanguageTestCard />
					<ThemeTestCard />
					<LocalStorageTestCard />
					<ToastTestCard />
				</div>
			</div>
		</div>
	)
}

export default DevPage
