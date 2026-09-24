import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'

export interface PersonaSocial {
	platform: string
	href: string
	icon: LucideIcon
}

interface PersonaCardProps {
	name: string
	image: string
	socials: PersonaSocial[]
}

export function PersonaCard({ name, image, socials }: PersonaCardProps) {
	const { t } = useTranslation()

	return (
		<figure className='group relative overflow-hidden rounded-3xl border border-border bg-muted shadow-md'>
			<img
				src={image}
				alt={name}
				loading='lazy'
				className='aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105'
			/>
			<figcaption className='absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-background via-background/80 to-transparent p-3 pt-12 sm:p-4 sm:pt-16'>
				<span className='truncate text-sm font-semibold text-foreground sm:text-base'>
					{name}
				</span>
				<span className='flex flex-wrap gap-1.5'>
					{socials.map(({ platform, href, icon: Icon }) => {
						const label = t('about.social_label', { name, platform })
						return (
							<a
								key={href}
								href={href}
								target='_blank'
								rel='noopener noreferrer'
								aria-label={label}
								title={label}
								className='flex size-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground'
							>
								<Icon className='size-4' />
							</a>
						)
					})}
				</span>
			</figcaption>
		</figure>
	)
}
