import React from 'react'
import { cn } from '@/utils/cn'

interface AppLogoProps {
	className?: string
	alt?: string
	/** If true, logo is inverted in light mode too (e.g. over dark video overlay) */
	alwaysInvert?: boolean
}

export const AppLogo: React.FC<AppLogoProps> = ({
	className = 'h-5 w-auto',
	alt = 'Logo',
	alwaysInvert = false,
}) => {
	return (
		<>
			{/* Light mode: Yao Yao logo */}
			<img
				src='/images/logo.png'
				className={cn(
					'object-contain dark:hidden',
					alwaysInvert && 'invert',
					className
				)}
				alt={alt || 'Yao Yao Logo'}
			/>
			{/* Dark mode: Aster logo */}
			<img
				src='/images/asterlogo.webp?v=2'
				className={cn(
					'hidden object-contain dark:block scale-110 origin-left',
					alwaysInvert ? 'invert' : 'dark:invert',
					className
				)}
				alt={alt || 'Aster Logo'}
			/>
		</>
	)
}

export default AppLogo
