import { useTranslation } from 'react-i18next'
import { MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ADDRESS = '43, Jalan SS15/4E, Subang Jaya, Subang Jaya, Malaysia'

export function LocationSection() {
	const { t } = useTranslation()

	return (
		<section className='overflow-hidden rounded-3xl border border-border bg-card shadow-md md:grid md:grid-cols-[2fr_3fr]'>
			<div className='flex flex-col gap-5 p-6 sm:p-8'>
				<div className='flex items-center gap-2.5'>
					<span className='flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary'>
						<MapPin className='size-4.5' />
					</span>
					<h2 className='text-xl font-bold text-foreground'>
						{t('about.location_title')}
					</h2>
				</div>

				<div>
					<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
						{t('about.address_label')}
					</p>
					<p className='mt-1 font-medium text-foreground'>
						{t('menu.restaurant_name')} · {t('menu.restaurant_en')}
					</p>
					<p className='mt-0.5 text-sm leading-relaxed text-muted-foreground'>
						{ADDRESS}
					</p>
				</div>

				<Button asChild className='mt-auto w-fit gap-1.5 rounded-full'>
					<a
						href='https://maps.app.goo.gl/FqCuu25uEUchCgZd7'
						target='_blank'
						rel='noopener noreferrer'
					>
						<Navigation className='size-3.5' />
						{t('about.get_directions')}
					</a>
				</Button>
			</div>

			<iframe
				title={t('about.location_title')}
				src={`https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`}
				className='h-64 w-full border-t border-border md:h-full md:min-h-80 md:border-l md:border-t-0'
				loading='lazy'
				referrerPolicy='no-referrer-when-downgrade'
			/>
		</section>
	)
}
