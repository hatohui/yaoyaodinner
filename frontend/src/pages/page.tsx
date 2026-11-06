import React, { useEffect } from 'react'
import { ASSET_URL } from '@/common/app'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import VideoPlayer from '@/components/common/VideoPlayer'
import { AppLogo } from '@/components/common/AppLogo'
import QuoteSection from '@/config/quotes'
import { DinnerTime } from './@DinnerTime'

const LandingPage = (): React.JSX.Element => {
	const { t } = useTranslation()

	// the hero fills the screen; stop iOS rubber-banding from dragging it around
	useEffect(() => {
		const root = document.documentElement
		const prev = root.style.overscrollBehavior
		root.style.overscrollBehavior = 'none'
		return () => {
			root.style.overscrollBehavior = prev
		}
	}, [])

	return (
		<div className='fixed inset-x-0 bottom-0 top-14 -z-10 overflow-hidden'>
			<div className='absolute inset-0 z-0'>
				<VideoPlayer
					className='h-full w-full object-cover'
					src={`${ASSET_URL}/banner.mp4`}
					muted
					autoPlay
					loop
					playsInline
				/>
				<div className='absolute inset-0 bg-black/40 dark:bg-black/60' />
			</div>

			<div className='relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto overscroll-contain px-4 pb-12 pt-6 text-center'>
				<AppLogo
					className='mb-6 h-12 w-auto drop-shadow-lg sm:h-16'
					alwaysInvert
				/>
				<h1 className='mb-4 text-4xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-6xl lg:text-7xl'>
					{t('menu.restaurant_name')}
				</h1>
				<QuoteSection />
				<DinnerTime />
				<div className='mt-8 flex flex-wrap items-center justify-center gap-4'>
					<Link
						to='/menu'
						className='rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-md'
					>
						{t('nav.menu')}
					</Link>
					<Link
						to='/tables'
						className='rounded-full border border-border bg-background/85 px-8 py-3 font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-background hover:shadow-md'
					>
						{t('nav.tables')}
					</Link>
				</div>
			</div>

			<div className='absolute bottom-4 z-10 w-full text-center text-sm font-medium text-white/60 drop-shadow-sm'>
				{t('landing.created_by')}{' '}
				<a
					href='https://www.youtube.com/watch?v=_e9yMqmXWo0'
					target='_blank'
					rel='noopener noreferrer'
					className='text-white/90 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white'
				>
					hatohui
				</a>
			</div>
		</div>
	)
}

export default LandingPage
