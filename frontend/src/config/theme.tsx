import { createContext, useContext, useEffect, useState } from 'react'
import { THEME_STORAGE_KEY } from '../common/constants'
import { getUserPreferredTheme } from '../utils/theme'
import { localStorage } from '../utils/localstorage'

type ThemeContextType = [theme: string, toggleTheme: () => void]

const ThemeContext = createContext<ThemeContextType>(['light', () => {}])

const ThemeProvider = ({
	children,
}: {
	children: React.ReactNode
}): React.JSX.Element => {
	const [theme, setTheme] = useState('light')

	useEffect(() => {
		const savedTheme = localStorage.load(THEME_STORAGE_KEY)

		if (savedTheme) {
			setTheme(savedTheme)
		} else {
			const userPreferredTheme = getUserPreferredTheme()
			setTheme(userPreferredTheme)
			localStorage.save(THEME_STORAGE_KEY, userPreferredTheme)
		}
	}, [])

	const toggleTheme = () => {
		setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
		localStorage.save(THEME_STORAGE_KEY, theme === 'light' ? 'dark' : 'light')
	}

	return (
		<ThemeContext.Provider value={[theme, toggleTheme]}>
			<div data-theme={theme}>{children}</div>
		</ThemeContext.Provider>
	)
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}
	return context
}

export default ThemeProvider
