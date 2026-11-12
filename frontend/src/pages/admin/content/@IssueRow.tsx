import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StoredImage } from '@/components/common/StoredImage'

interface IssueRowProps {
	name: string
	isAvailable: boolean
	imageKey?: string | null
	showImage?: boolean
	missingLocales?: string[]
	missingNames?: string[]
	missingDescriptions?: string[]
	missingVariants?: string[]
	variantLabels?: string[]
	children: ReactNode
}

export function IssueRow({
	name,
	isAvailable,
	imageKey,
	showImage = true,
	missingLocales,
	missingNames,
	missingDescriptions,
	missingVariants,
	variantLabels,
	children,
}: IssueRowProps) {
	const { t } = useTranslation()

	const hasDetailed =
		(missingNames && missingNames.length > 0) ||
		(missingDescriptions && missingDescriptions.length > 0) ||
		(missingVariants && missingVariants.length > 0)

	return (
		<li className='flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm'>
			{showImage && (
				<div className='flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground'>
					<StoredImage
						imageKey={imageKey}
						className='size-full object-cover'
						fallback={<ImageOff className='size-4' />}
					/>
				</div>
			)}
			<div className='flex min-w-0 flex-1 flex-col gap-1'>
				<div className='flex items-center gap-2'>
					<p className='truncate text-sm font-medium text-foreground'>
						{name || t('admin.content.untitled')}
					</p>
					{!isAvailable && (
						<Badge
							variant='outline'
							className='text-[10px] text-muted-foreground'
						>
							{t('admin.content.hidden')}
						</Badge>
					)}
				</div>
				{hasDetailed ? (
					<div className='flex flex-col gap-1'>
						{missingNames && missingNames.length > 0 && (
							<div className='flex flex-wrap items-center gap-1.5'>
								<span className='text-xs text-muted-foreground'>
									{t('admin.content.missing_name')}:
								</span>
								{missingNames.map(locale => (
									<Badge
										key={locale}
										variant='outline'
										className='border-destructive/30 bg-destructive/10 text-[10px] uppercase text-destructive'
									>
										{locale}
									</Badge>
								))}
							</div>
						)}
						{missingDescriptions && missingDescriptions.length > 0 && (
							<div className='flex flex-wrap items-center gap-1.5'>
								<span className='text-xs text-muted-foreground'>
									{t('admin.content.missing_description')}:
								</span>
								{missingDescriptions.map(locale => (
									<Badge
										key={locale}
										variant='outline'
										className='border-destructive/30 bg-destructive/10 text-[10px] uppercase text-destructive'
									>
										{locale}
									</Badge>
								))}
							</div>
						)}
						{missingVariants && missingVariants.length > 0 && (
							<div className='flex flex-wrap items-center gap-1.5'>
								<span className='text-xs text-muted-foreground'>
									{variantLabels && variantLabels.length > 0
										? t('admin.content.missing_options_with_labels', {
												labels: variantLabels.join(', '),
											})
										: t('admin.content.missing_options')}
									:
								</span>
								{missingVariants.map(locale => (
									<Badge
										key={locale}
										variant='outline'
										className='border-destructive/30 bg-destructive/10 text-[10px] uppercase text-destructive'
									>
										{locale}
									</Badge>
								))}
							</div>
						)}
					</div>
				) : missingLocales && missingLocales.length > 0 ? (
					<div className='flex flex-wrap items-center gap-1'>
						<span className='text-xs text-muted-foreground'>
							{t('admin.content.missing')}
						</span>
						{missingLocales.map(locale => (
							<Badge
								key={locale}
								variant='outline'
								className='border-destructive/30 bg-destructive/10 text-[10px] uppercase text-destructive'
							>
								{locale}
							</Badge>
						))}
					</div>
				) : null}
			</div>
			<div className='flex shrink-0 items-center gap-2'>{children}</div>
		</li>
	)
}
