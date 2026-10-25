import React from 'react'
import { Navbar } from '@/components/common/Navbar'
import { useGuestSession } from '@/hooks/useGuestSession'
import { AnnouncementBanner } from './@AnnouncementBanner'

const MainLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement => {
	useGuestSession()

	return (
		<div>
			<Navbar />
			<main className='pt-14'>
				<AnnouncementBanner />
				{children}
			</main>
		</div>
	)
}

export default MainLayout
