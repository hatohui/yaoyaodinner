import React from 'react'
import { ASSET_URL } from '@/common/app'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import VideoPlayer from '@/components/common/VideoPlayer'
import QuoteSection from '@/config/quotes'

const LandingPage = (): React.JSX.Element => {
	const { t } = useTranslation()
	return (
		<div className='relative min-h-[calc(100dvh-3.5rem)] w-full overflow-hidden'>
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

			<div className='relative z-10 flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4 text-center'>
				<img
					src='/images/logo.png'
					className='mb-6 h-12 w-auto object-contain invert drop-shadow-lg sm:h-16'
					alt='Logo'
				/>
				<h1 className='mb-4 text-4xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-6xl lg:text-7xl'>
					{t('menu.restaurant_name')}
				</h1>
				<QuoteSection />
				<div className='mt-8 flex flex-wrap items-center justify-center gap-4'>
					<Link
						to='/menu'
						className='rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-md'
					>
						{t('nav.menu')}
					</Link>
					<Link
						to='/tables'
						className='rounded-full bg-white/20 px-8 py-3 font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-white/30 hover:shadow-md'
					>
						{t('nav.tables')}
					</Link>
				</div>
			</div>

			<div className='absolute bottom-4 z-10 w-full text-center text-sm font-medium text-white/60 drop-shadow-sm'>
				Website created by{' '}
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
