import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Expand } from 'lucide-react'
import type { TableDto } from '@/api/model'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { ImageViewer } from '@/components/common/ImageViewer'
import { StoredImage } from '@/components/common/StoredImage'
import { defaultBannerSrc } from '../@tableCardUtils'

interface TableBannerProps {
	table: TableDto
	canEdit: boolean
	onChange: (bannerUrl: string | null) => void
}

export function TableBanner({ table, canEdit, onChange }: TableBannerProps) {
	const { t } = useTranslation()
	const [viewing, setViewing] = useState(false)

	const fallback = (
		<img
			src={defaultBannerSrc(table.no)}
			alt=''
			className='size-full rounded-2xl object-cover'
		/>
	)

	if (canEdit) {
		return (
			<ImageUploadSlot
				shape='banner'
				folder='table-banners'
				imageKey={table.bannerUrl}
				onChange={onChange}
				fallback={fallback}
				aspect={16 / 9}
				className='aspect-video h-auto sm:max-h-56 ring-1 ring-black/10 dark:ring-white/15'
			/>
		)
	}

	return (
		<div className='relative'>
			<StoredImage
				imageKey={table.bannerUrl}
				className='aspect-video w-full rounded-2xl object-cover sm:max-h-56'
				fallback={<div className='aspect-video sm:max-h-56'>{fallback}</div>}
			/>
			<span className='pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 dark:ring-white/15' />
			{table.bannerUrl && (
				<>
					<button
						type='button'
						onClick={() => setViewing(true)}
						aria-label={t('common.view_image')}
						className='absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70'
					>
						<Expand className='size-3.5' />
					</button>
					<ImageViewer
						imageKey={table.bannerUrl}
						open={viewing}
						onOpenChange={setViewing}
					/>
				</>
			)}
		</div>
	)
}
