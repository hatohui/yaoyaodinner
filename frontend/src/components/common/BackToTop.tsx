import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowUp } from 'lucide-react'
import { smoothScrollTo } from '@/utils/smoothScroll'
import { cn } from '@/utils/shadcn'

interface BackToTopProps {
	threshold?: number
	className?: string
}

export function BackToTop({ threshold = 300, className }: BackToTopProps) {
	const { t } = useTranslation()
	const { pathname } = useLocation()
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		const onScroll = () => {
			setVisible(window.scrollY > threshold)
		}

		window.addEventListener('scroll', onScroll, { passive: true })
		onScroll()

		return () => window.removeEventListener('scroll', onScroll)
	}, [threshold])

	// Landing page is fixed full-viewport hero; do not show
	if (pathname === '/') return null

	const scrollToTop = () => {
		smoothScrollTo(0, 0.5)
	}

	const isMenuPage = pathname.startsWith('/menu')

	return (
		<button
			type='button'
			onClick={scrollToTop}
			aria-label={t('common.back_to_top')}
			title={t('common.back_to_top')}
			className={cn(
				'fixed z-40 flex size-10 items-center justify-center rounded-full',
				'border border-border/80 bg-card/90 text-foreground shadow-md backdrop-blur-md',
				'transition-all duration-300 hover:border-primary/60 hover:bg-primary hover:text-primary-foreground hover:shadow-lg',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95',
				'sm:size-11',
				isMenuPage
					? 'bottom-20 right-4 sm:bottom-22 sm:right-6'
					: 'bottom-5 right-4 sm:bottom-6 sm:right-6',
				visible
					? 'translate-y-0 opacity-100 pointer-events-auto'
					: 'translate-y-4 opacity-0 pointer-events-none',
				className
			)}
		>
			<ArrowUp className='size-5 transition-transform hover:-translate-y-0.5' />
		</button>
	)
}
