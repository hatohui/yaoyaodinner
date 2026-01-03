import React from 'react'
import { LanguageSelector } from '@/components/common/LanguageSelector'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import VideoPlayer from '@/components/common/VideoPlayer'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

const LandingPage = (): React.JSX.Element => {
	return (
		<div className='dark:bg-green-300'>
			<div className='absolute top-4 right-4 h-10 flex gap-2 z-10'>
				<Link to='/health'>
					<Button variant='outline'>Health</Button>
				</Link>
				<Link to='/dev'>
					<Button variant='outline'>Dev</Button>
				</Link>
				<ThemeToggle />
				<LanguageSelector />
			</div>
			<VideoPlayer src='/videos/banner.mp4' muted autoPlay loop playsInline />
		</div>
	)
}

export default LandingPage
