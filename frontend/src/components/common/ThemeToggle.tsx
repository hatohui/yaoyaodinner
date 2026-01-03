import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/config/theme'

export const ThemeToggle = () => {
	const [theme, toggleTheme] = useTheme()

	return (
		<button
			onClick={toggleTheme}
			className='flex items-center justify-center rounded-md border border-border bg-card px-2 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
			aria-label='Toggle theme'
		>
			{theme === 'dark' ? (
				<Sun className='h-5 w-5' />
			) : (
				<Moon className='h-5 w-5' />
			)}
		</button>
	)
}
