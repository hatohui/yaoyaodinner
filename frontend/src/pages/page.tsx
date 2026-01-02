import React from 'react'
import { LanguageSelector } from '@/components/common/LanguageSelector'
import { ThemeToggle } from '@/components/common/ThemeToggle'

const LandingPage = (): React.JSX.Element => {
	return (
		<div className='dark:bg-green-300'>
			Landing page.
			<div className=''>Normal mode I think</div>
			<div className='dark:text-red-400'>Dark mode</div>
			<ThemeToggle />
			<LanguageSelector />
		</div>
	)
}

export default LandingPage
