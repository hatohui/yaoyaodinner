import { AboutHero } from './@AboutHero'
import { LocationSection } from './@LocationSection'
import { YaoYaoDetailsSection } from './@YaoYaoDetailsSection'

export default function AboutPage() {
	return (
		<div className='min-h-screen'>
			<AboutHero />
			<div className='mx-auto flex max-w-5xl flex-col gap-16 px-4 py-14 sm:gap-20 sm:py-20'>
				<YaoYaoDetailsSection />
				<LocationSection />
			</div>
		</div>
	)
}
