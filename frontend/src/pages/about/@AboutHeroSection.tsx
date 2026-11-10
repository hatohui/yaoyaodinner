import { useTranslation } from 'react-i18next'
import { Sparkles, Users } from 'lucide-react'

export function AboutHeroSection() {
	const { t } = useTranslation()

	return (
		<section className='flex flex-col gap-4 border-b border-border pb-8 sm:pb-10'>
			<div className='flex flex-wrap items-center gap-2'>
				<span className='inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-xs'>
					<Sparkles className='size-3.5' />
					{t('about.hero_tag')}
				</span>
				<span className='inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground'>
					<Users className='size-3.5' />
					{t('about.hero_badge_private')}
				</span>
			</div>

			<h1 className='text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl'>
				{t('about.hero_title')}
			</h1>

			<p className='max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg'>
				{t('about.hero_subtitle')}
			</p>
		</section>
	)
}
