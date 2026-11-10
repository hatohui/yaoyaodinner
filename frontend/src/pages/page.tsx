import React, { useEffect } from 'react'
import { ASSET_URL } from '@/common/app'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import VideoPlayer from '@/components/common/VideoPlayer'
import { AppLogo } from '@/components/common/AppLogo'
import QuoteSection from '@/config/quotes'
import { useConfig } from '@/hooks/useConfig'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { EventFacts } from './@EventFacts'

const LandingPage = (): React.JSX.Element => {
	const { t } = useTranslation()
	const { menu, tables, isLoading } = useConfig()
	const { isAdmin } = useIsAdmin()
	const showMenu = !isLoading && (menu || isAdmin)
	const showTables = !isLoading && (tables || isAdmin)

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
				{/* darkest where the text sits, so the food stays visible on the right */}
				<div className='absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/5' />
				<div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent' />
			</div>

			<div className='relative z-10 flex h-full flex-col justify-end overflow-y-auto overscroll-contain px-6 pb-16 pt-6 sm:px-12 sm:pb-20 lg:px-20'>
				<div className='flex max-w-xl flex-col gap-4 sm:gap-5'>
					<AppLogo
						className='h-12 w-auto self-start drop-shadow-lg sm:h-20'
						alwaysInvert
					/>
					<div className='flex flex-col gap-1.5'>
						<span className='text-xs font-bold uppercase tracking-widest text-white/75 sm:text-sm'>
							{t('menu.restaurant_name')} · {t('menu.restaurant_en')}
						</span>
						<h1 className='text-2xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-3xl md:text-4xl'>
							{t('landing.event_name')}
						</h1>
						<p className='text-xs font-medium text-white/80 sm:text-sm'>
							{t('landing.event_subtitle')}
						</p>
					</div>
					<QuoteSection />
					<EventFacts />
					{(showMenu || showTables) && (
						<div className='mt-2 flex flex-wrap items-center gap-3'>
							{showMenu && (
								<Link
									to='/menu'
									className='rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-md'
								>
									{t('nav.menu')}
								</Link>
							)}
							{showTables && (
								<Link
									to='/tables'
									className='rounded-full border border-border bg-background/85 px-7 py-3 font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-background hover:shadow-md'
								>
									{t('nav.tables')}
								</Link>
							)}
						</div>
					)}
				</div>
			</div>

			<div className='absolute bottom-4 right-6 z-10 text-xs font-medium text-white/60 drop-shadow-sm sm:right-12 sm:text-sm lg:right-20'>
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
