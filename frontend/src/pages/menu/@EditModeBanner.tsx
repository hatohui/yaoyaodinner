import { useTranslation } from 'react-i18next'
import { PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditModeBannerProps {
	onExit: () => void
}

export function EditModeBanner({ onExit }: EditModeBannerProps) {
	const { t } = useTranslation()

	return (
		<div className='mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-primary bg-brand-muted px-4 py-3'>
			<span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
				<PencilLine className='size-4' />
			</span>
			<div className='flex min-w-0 flex-1 flex-col'>
				<span className='text-sm font-semibold text-foreground'>
					{t('menu.admin.title')}
				</span>
				<span className='text-xs text-muted-foreground'>
					{t('menu.admin.banner')}
				</span>
			</div>
			<Button
				size='sm'
				variant='outline'
				className='shrink-0 rounded-full'
				onClick={onExit}
			>
				{t('menu.admin.exit')}
			</Button>
		</div>
	)
}
