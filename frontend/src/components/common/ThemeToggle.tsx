import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/config/theme'

export const ThemeToggle = () => {
	const { t } = useTranslation()
	const [theme, toggleTheme] = useTheme()

	return (
		<button
			type='button'
			onClick={toggleTheme}
			className='flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-accent/50'
			aria-label={t('a11y.toggle_theme')}
		>
			{theme === 'dark' ? (
				<Sun className='size-4' />
			) : (
				<Moon className='size-4' />
			)}
		</button>
	)
}
