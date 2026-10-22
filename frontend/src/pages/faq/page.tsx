import { useTranslation } from 'react-i18next'
import { CircleHelp } from 'lucide-react'
import { FaqList } from './@FaqList'

export default function FaqPage() {
	const { t } = useTranslation()

	return (
		<div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12'>
			<div>
				<span className='inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary'>
					<CircleHelp className='size-3.5' />
					{t('faq.tag')}
				</span>
				<h1 className='mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
					{t('faq.title')}
				</h1>
				<p className='mt-2 text-muted-foreground'>{t('faq.subtitle')}</p>
			</div>
			<FaqList />
		</div>
	)
}
