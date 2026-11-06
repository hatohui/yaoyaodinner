import { LocationSection } from './@LocationSection'
import { YaoYaoDetailsSection } from './@YaoYaoDetailsSection'

export default function AboutPage() {
	return (
		<div className='mx-auto flex max-w-5xl flex-col gap-14 px-4 py-10 sm:gap-20 sm:py-16'>
			<YaoYaoDetailsSection />
			<LocationSection />
		</div>
	)
}
