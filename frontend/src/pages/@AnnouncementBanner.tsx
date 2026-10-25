import { useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/hooks/useConfig'

export function AnnouncementBanner() {
	const { t } = useTranslation()
	const { bannerMessage } = useConfig()
	const [dismissed, setDismissed] = useState('')

	if (!bannerMessage || dismissed === bannerMessage) return null

	return (
		<div
			role='status'
			className='flex items-center gap-3 border-b border-primary/30 bg-brand-muted px-4 py-2.5'
		>
			<Megaphone className='size-4 shrink-0 text-primary' />
			<p className='min-w-0 flex-1 text-sm font-medium text-foreground'>
				{bannerMessage}
			</p>
			<button
				type='button'
				aria-label={t('banner.dismiss')}
				onClick={() => setDismissed(bannerMessage)}
				className='shrink-0 text-muted-foreground transition-colors hover:text-foreground'
			>
				<X className='size-4' />
			</button>
		</div>
	)
}
