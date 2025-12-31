import React from 'react'
import { useTheme } from '../config/theme'
import useSignedUrl from '../hooks/images/useSignedUrl'

const LandingPage = (): React.JSX.Element => {
	const [theme, toggle] = useTheme()

	const { data } = useSignedUrl('menu')

	return (
		<div className='dark:bg-green-300'>
			Landing page.
			<div className=''>Normal mode I think</div>
			<button onClick={toggle}>Current theme: {theme}</button>
			<div className='dark:text-red-400'>Dark mode</div>
			<div>Signed URL: {data?.url}</div>
			<div>Key: {data?.key}</div>
		</div>
	)
}

export default LandingPage
