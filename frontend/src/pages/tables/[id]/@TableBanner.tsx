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
	editing: boolean
	onChange: (bannerUrl: string | null) => void
}

export function TableBanner({ table, editing, onChange }: TableBannerProps) {
	const { t } = useTranslation()
	const [viewing, setViewing] = useState(false)

	if (editing) {
		return (
			<ImageUploadSlot
				shape='banner'
				folder='table-banners'
				imageKey={table.bannerUrl}
				onChange={onChange}
			/>
		)
	}

	return (
		<div className='relative'>
			<StoredImage
				imageKey={table.bannerUrl}
				className='h-32 w-full rounded-2xl object-cover'
				fallback={
					<img
						src={defaultBannerSrc(table.no)}
						alt=''
						className='h-32 w-full rounded-2xl object-cover'
					/>
				}
			/>
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
