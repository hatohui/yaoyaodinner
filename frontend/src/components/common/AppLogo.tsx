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
	alt = 'Furum After Gathering',
	alwaysInvert = false,
}) => {
	return (
		<span className='inline-grid w-fit items-center justify-items-start'>
			{/* Light mode: Yao Yao logo */}
			<img
				src='/images/logo.png'
				className={cn(
					'col-start-1 row-start-1 object-contain dark:invisible',
					alwaysInvert && 'invert',
					className
				)}
				alt={alt || 'Furum After Gathering'}
			/>
			{/* Dark mode: Aster logo */}
			<img
				src='/images/asterlogo.webp?v=2'
				className={cn(
					'invisible col-start-1 row-start-1 origin-left scale-110 object-contain dark:visible',
					alwaysInvert ? 'invert' : 'dark:invert',
					className
				)}
				alt={alt || 'Furum After Gathering'}
			/>
		</span>
	)
}

export default AppLogo
