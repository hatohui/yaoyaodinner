import React, { Suspense, lazy } from 'react'
import { Navbar } from '@/components/common/Navbar'
import { IdentityTour } from '@/components/onboarding/IdentityTour'
import { useGuestSession } from '@/hooks/useGuestSession'
import { AnnouncementBanner } from './@AnnouncementBanner'
import { NavigationProgress } from '@/components/common/NavigationProgress'
import { ScrollRestoration } from 'react-router'

// decorative and GSAP-heavy, so it loads after the page instead of with it
const AnimatedBlobs = lazy(() =>
	import('@/components/common/AnimatedBlobs').catch(() => ({
		default: () => <></>,
	}))
)

const MainLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement => {
	useGuestSession()

	return (
		<div className='relative min-h-screen'>
			<NavigationProgress />
			{/* new visits open at the top; back/forward returns to where you were */}
			<ScrollRestoration />
			<Suspense fallback={null}>
				<AnimatedBlobs />
			</Suspense>
			<Navbar />
			<main className='pt-14 relative z-10'>
				<AnnouncementBanner />
				{children}
			</main>
			<IdentityTour />
		</div>
	)
}

export default MainLayout
