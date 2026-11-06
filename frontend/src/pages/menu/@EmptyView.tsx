import { UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface EmptyViewProps {
	onReset?: () => void
	hasFilters?: boolean
}

export function EmptyView({ onReset, hasFilters }: EmptyViewProps) {
	const { t } = useTranslation()

	return (
		<div className='mx-auto my-12 flex max-w-md flex-col items-center justify-center rounded-3xl border border-border bg-card/95 px-6 py-12 text-center shadow-sm backdrop-blur-md'>
			<div className='mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-muted'>
				<UtensilsCrossed className='h-10 w-10 text-primary' />
			</div>
			<h3 className='mb-2 text-xl font-semibold'>
				{hasFilters ? t('menu.no_dishes_title') : t('menu.menu_empty_title')}
			</h3>
			<p className='mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground'>
				{hasFilters ? t('menu.no_dishes_desc') : t('menu.menu_empty_desc')}
			</p>
			{hasFilters && onReset && (
				<Button
					variant='outline'
					onClick={onReset}
					className='rounded-full border-primary/40 text-primary hover:bg-brand-muted'
				>
					{t('menu.clear_filters')}
				</Button>
			)}
		</div>
	)
}
