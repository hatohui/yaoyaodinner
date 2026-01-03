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
			<div className='fixed h-screen w-screen inset-0 z-0'>
				<VideoPlayer
					className='absolute inset-0'
					src='/videos/banner.mp4'
					muted
					autoPlay
					loop
					playsInline
				/>
				<div className='absolute inset-0 bg-black/40 dark:bg-black/60' />
			</div>
		</div>
	)
}

export default LandingPage
