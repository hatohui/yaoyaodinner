import { useTranslation } from 'react-i18next'
import { Facebook, PawPrint, Twitch, Twitter } from 'lucide-react'
import { PersonaCard } from './@PersonaCard'

export function YaoYaoDetailsSection() {
	const { t } = useTranslation()

	return (
		<section className='grid items-center gap-8 md:grid-cols-[1fr_1.15fr] md:gap-12'>
			<div>
				<span className='inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-semibold text-primary shadow-xs'>
					<PawPrint className='size-3.5' />
					{t('about.details_tag')}
				</span>

				<h1 className='mt-3 text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl'>
					{t('about.details_title')}
				</h1>

				<div className='mt-4 flex flex-col gap-3 leading-relaxed text-foreground/90'>
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
		</section>
	)
}
