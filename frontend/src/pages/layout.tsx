import React, { Suspense, lazy } from 'react'
import { Navbar } from '@/components/common/Navbar'
import { useGuestSession } from '@/hooks/useGuestSession'
import { AnnouncementBanner } from './@AnnouncementBanner'
import { NavigationProgress } from '@/components/common/NavigationProgress'

// decorative and GSAP-heavy, so it loads after the page instead of with it
const AnimatedBlobs = lazy(() => import('@/components/common/AnimatedBlobs'))

const MainLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement => {
	useGuestSession()

	return (
		<div className='relative min-h-screen'>
			<NavigationProgress />
			<Suspense fallback={null}>
				<AnimatedBlobs />
			</Suspense>
			<Navbar />
			<main className='pt-14 relative z-10'>
				<AnnouncementBanner />
				{children}
			</main>
		</div>
	)
}

export default MainLayout
