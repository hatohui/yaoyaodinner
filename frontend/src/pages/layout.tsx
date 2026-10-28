import React from 'react'
import { Navbar } from '@/components/common/Navbar'
import { useGuestSession } from '@/hooks/useGuestSession'
import { AnnouncementBanner } from './@AnnouncementBanner'
import { AnimatedBlobs } from '@/components/common/AnimatedBlobs'

const MainLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement => {
	useGuestSession()

	return (
		<div className='relative min-h-screen'>
			<AnimatedBlobs />
			<Navbar />
			<main className='pt-14 relative z-10'>
				<AnnouncementBanner />
				{children}
			</main>
		</div>
	)
}

export default MainLayout
