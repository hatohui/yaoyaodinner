import { useTranslation } from 'react-i18next'
import { ShoppingCart, X } from 'lucide-react'

interface SelectionBarProps {
	count: number
	onClear: () => void
	onAdd: () => void
}

export function SelectionBar({ count, onClear, onAdd }: SelectionBarProps) {
	const { t } = useTranslation()

	if (count === 0) return null

	return (
		<div className='fixed right-4 bottom-4 z-30 flex items-center gap-2 animate-in duration-300 fade-in slide-in-from-bottom-4 zoom-in-90 sm:right-6 sm:bottom-6'>
			<button
				type='button'
				onClick={onClear}
				aria-label={t('menu.clear_selection')}
				title={t('menu.clear_selection')}
				className='flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-colors hover:bg-primary/10 hover:text-primary'
			>
				<X className='size-4' />
			</button>

			<button
				type='button'
				onClick={onAdd}
				aria-label={t('menu.view_cart', { count })}
				className='flex h-12 items-center gap-2 rounded-full bg-primary pr-5 pl-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95'
			>
				<span className='relative'>
					<ShoppingCart className='size-5' />
					<span
						key={count}
						className='absolute -top-2 -right-2.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-background px-1 text-[10px] leading-none font-bold text-primary animate-in zoom-in-50'
					>
						{count}
					</span>
				</span>
				<span className='ml-1'>{t('menu.cart')}</span>
			</button>
		</div>
	)
}
