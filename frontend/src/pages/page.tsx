import React from 'react'
import { useTheme } from '../config/theme'

const LandingPage = (): React.JSX.Element => {
	const [theme, toggle] = useTheme()

	return (
		<div className='dark:bg-green-300'>
			Landing page.
			<div className=''>Normal mode</div>
			<button onClick={toggle}>Current theme: {theme}</button>
			<div className='dark:text-red-400'>Dark mode</div>
		</div>
	)
}

export default LandingPage
