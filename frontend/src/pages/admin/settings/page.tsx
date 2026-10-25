import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { ConfigRow } from './@ConfigRow'
import { useAdminConfig } from './@useAdminConfig'

const CATEGORY_LABELS: Record<string, string> = {
	auth: 'admin.settings.category_auth',
	event: 'admin.settings.category_event',
	tables: 'admin.settings.category_tables',
	feedback: 'admin.settings.category_feedback',
	features: 'admin.settings.category_features',
	banner: 'admin.settings.category_banner',
}

export default function AdminSettingsPage() {
	const { t } = useTranslation()
	const { groups, isLoading, save } = useAdminConfig()

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-col gap-1'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.settings.title')}
				</h1>
				<p className='text-sm text-muted-foreground'>
					{t('admin.settings.subtitle')}
				</p>
			</div>

			{isLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : groups.length === 0 ? (
				<p className='rounded-2xl border border-dashed border-border/60 px-5 py-8 text-center text-sm text-muted-foreground'>
					{t('admin.settings.empty')}
				</p>
			) : (
				groups.map(([category, items]) => (
					<div key={category} className='flex flex-col gap-2'>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
							{CATEGORY_LABELS[category]
								? t(CATEGORY_LABELS[category])
								: category}
						</p>
						<Card className='divide-y divide-border/60 px-4 py-1'>
							{items.map(item => (
								<ConfigRow key={item.key} item={item} onSave={save} />
							))}
						</Card>
					</div>
				))
			)}
		</div>
	)
}
