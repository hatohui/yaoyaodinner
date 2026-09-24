import { useTranslation } from 'react-i18next'
import { Facebook, PartyPopper, Twitch, Twitter } from 'lucide-react'
import { PersonaCard } from './@PersonaCard'

export function YaoYaoDetailsSection() {
	const { t } = useTranslation()

	return (
		<section className='grid items-center gap-8 md:grid-cols-[1fr_1.15fr] md:gap-12'>
			<div>
				<span className='inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary'>
					<PartyPopper className='size-3.5' />
					{t('about.details_tag')}
				</span>

				<h2 className='mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
					{t('about.details_title')}
				</h2>

				<div className='mt-4 flex flex-col gap-3 leading-relaxed text-muted-foreground'>
					<p>{t('about.details_body_1')}</p>
					<p>{t('about.details_body_2')}</p>
				</div>
			</div>

			<div className='grid grid-cols-2 gap-3 sm:gap-4'>
				<PersonaCard
					name={t('about.persona_yaoyao')}
					image='/images/yaoyao.jpg'
					socials={[
						{
							platform: 'Facebook',
							href: 'https://www.facebook.com/chee.yao.963',
							icon: Facebook,
						},
						{ platform: 'X', href: 'https://x.com/Huskyaoo', icon: Twitter },
						{
							platform: 'Twitch',
							href: 'https://www.twitch.tv/Huskyao',
							icon: Twitch,
						},
					]}
				/>
				<div className='translate-y-6'>
					<PersonaCard
						name={t('about.persona_aster')}
						image='/images/aster.jpg'
						socials={[
							{
								platform: 'Facebook',
								href: 'https://www.facebook.com/AsterTheDragon',
								icon: Facebook,
							},
							{
								platform: 'X',
								href: 'https://x.com/asterdragon_',
								icon: Twitter,
							},
						]}
					/>
				</div>
			</div>
		</section>
	)
}
