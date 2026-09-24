import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
	ArrowRight,
	MapPin,
	PawPrint,
	Sparkles,
	UtensilsCrossed,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfig } from '@/hooks/useConfig'

export function AboutHero() {
	const { t } = useTranslation()
	const { tables } = useConfig()

	return (
		<section className='relative isolate overflow-hidden border-b border-border/60'>
			<img
				src='/images/banner.png'
				alt=''
				className='absolute inset-0 -z-10 size-full object-cover object-right'
			/>
			<div className='absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/85 to-background/40 sm:bg-gradient-to-r sm:via-background/80 sm:to-transparent' />
			<PawPrint className='absolute -left-6 bottom-6 -z-10 size-32 -rotate-12 text-primary/10' />

			<div className='mx-auto max-w-5xl px-4 pb-14 pt-32 sm:py-24'>
				<div className='max-w-md'>
					<span className='inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm'>
						<Sparkles className='size-3.5' />
						{t('about.hero_tag')}
					</span>

					<h1 className='mt-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl'>
						{t('menu.restaurant_name')}
					</h1>
					<p className='mt-1 text-lg font-medium text-foreground/80'>
						{t('menu.restaurant_en')}
					</p>

					<p className='mt-4 border-l-2 border-primary/60 pl-3 text-sm italic text-muted-foreground'>
						{t('about.tagline')}
					</p>

					<div className='mt-3 flex items-center gap-1.5 text-sm text-muted-foreground'>
						<MapPin className='size-3.5 text-primary' />
						<span>{t('menu.restaurant_location')}</span>
					</div>

					<div className='mt-6 flex flex-wrap gap-2'>
						<Button asChild className='gap-1.5 rounded-full'>
							<Link to='/menu'>
								<UtensilsCrossed className='size-4' />
								{t('about.cta_menu')}
							</Link>
						</Button>
						{tables && (
							<Button
								asChild
								variant='outline'
								className='gap-1.5 rounded-full bg-background/60 backdrop-blur-sm'
							>
								<Link to='/tables'>
									{t('about.cta_tables')}
									<ArrowRight className='size-4' />
								</Link>
							</Button>
						)}
					</div>
				</div>
			</div>
		</section>
	)
}
