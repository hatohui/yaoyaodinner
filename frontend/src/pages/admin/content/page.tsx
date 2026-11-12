import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { AiFillButton } from './@AiFillButton'
import { FoodDraftDialog } from './@FoodDraftDialog'
import { IssueRow } from './@IssueRow'
import { useContentHealth, type ContentTab } from './@useContentHealth'

const TABS: ContentTab[] = [
	'translations',
	'descriptions',
	'images',
	'categories',
]

export default function AdminContentHealthPage() {
	const { t } = useTranslation()
	const [tab, setTab] = useState<ContentTab>('translations')
	const {
		isLoading,
		lists,
		pendingIds,
		batch,
		fillCategory,
		fillAll,
		setImage,
		refresh,
	} = useContentHealth()
	const [reviewing, setReviewing] = useState<{
		id: string
		name: string
		describe: boolean
	} | null>(null)

	const busy = batch !== null
	const fillAllCount = tab === 'images' ? 0 : lists[tab].length

	const empty = (
		<div className='flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground'>
			<CircleCheck className='size-6 text-primary' />
			{t('admin.content.all_good')}
		</div>
	)

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-start justify-between gap-3'>
				<div className='flex flex-col gap-1'>
					<h1 className='text-xl font-bold text-foreground'>
						{t('admin.content.title')}
					</h1>
					<p className='text-sm text-muted-foreground'>
						{t('admin.content.subtitle')}
					</p>
				</div>
				{(fillAllCount > 0 || batch) && (
					<AiFillButton
						size='default'
						variant='default'
						pending={busy}
						label={
							batch
								? t('admin.content.fixing', {
										done: batch.done,
										total: batch.total,
									})
								: t('admin.content.fix_all', { count: fillAllCount })
						}
						onClick={() => tab !== 'images' && fillAll(tab)}
					/>
				)}
			</div>

			{isLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : (
				<Tabs
					value={tab}
					onValueChange={v => setTab(v as ContentTab)}
					className='flex flex-col gap-4'
				>
					<TabsList className='flex-wrap'>
						{TABS.map(key => (
							<TabsTrigger key={key} value={key} className='gap-1.5'>
								{t(`admin.content.tabs.${key}`)}
								{lists[key].length > 0 && (
									<Badge
										variant='outline'
										className='text-[10px] group-data-[state=active]/trigger:border-primary-foreground/30 group-data-[state=active]/trigger:text-primary-foreground'
									>
										{lists[key].length}
									</Badge>
								)}
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value='translations'>
						{lists.translations.length === 0 ? (
							empty
						) : (
							<ul className='flex flex-col gap-2'>
								{lists.translations.map(food => (
									<IssueRow
										key={food.id}
										name={food.name}
										isAvailable={food.isAvailable}
										imageKey={food.imageUrl}
										missingLocales={food.missingTranslations}
										missingNames={food.missingNames}
										missingDescriptions={food.missingDescriptions}
										missingVariants={food.missingVariants}
										variantLabels={food.variantLabels}
									>
										<AiFillButton
											label={t('admin.content.ai_translate')}
											disabled={busy}
											onClick={() =>
												setReviewing({
													id: food.id,
													name: food.name,
													describe: false,
												})
											}
										/>
									</IssueRow>
								))}
							</ul>
						)}
					</TabsContent>

					<TabsContent value='descriptions'>
						{lists.descriptions.length === 0 ? (
							empty
						) : (
							<ul className='flex flex-col gap-2'>
								{lists.descriptions.map(food => (
									<IssueRow
										key={food.id}
										name={food.name}
										isAvailable={food.isAvailable}
										imageKey={food.imageUrl}
									>
										<AiFillButton
											label={t('admin.content.ai_describe')}
											disabled={busy}
											onClick={() =>
												setReviewing({
													id: food.id,
													name: food.name,
													describe: true,
												})
											}
										/>
									</IssueRow>
								))}
							</ul>
						)}
					</TabsContent>

					<TabsContent value='images'>
						{lists.images.length === 0 ? (
							empty
						) : (
							<ul className='flex flex-col gap-2'>
								{lists.images.map(food => (
									<IssueRow
										key={food.id}
										name={food.name}
										isAvailable={food.isAvailable}
										showImage={false}
									>
										<ImageUploadSlot
											shape='banner'
											compact
											folder='foods'
											aspect={4 / 3}
											imageKey={food.imageUrl}
											onChange={key => setImage(food.id, key)}
										/>
									</IssueRow>
								))}
							</ul>
						)}
					</TabsContent>

					<TabsContent value='categories'>
						{lists.categories.length === 0 ? (
							empty
						) : (
							<ul className='flex flex-col gap-2'>
								{lists.categories.map(category => (
									<IssueRow
										key={category.id}
										name={category.name}
										isAvailable={category.isAvailable}
										showImage={false}
										missingLocales={category.missingTranslations}
										missingNames={category.missingNames ?? category.missingTranslations}
									>
										<AiFillButton
											label={t('admin.content.ai_translate')}
											pending={pendingIds.has(category.id)}
											disabled={busy}
											onClick={() => fillCategory(category.id)}
										/>
									</IssueRow>
								))}
							</ul>
						)}
					</TabsContent>
				</Tabs>
			)}

			<FoodDraftDialog
				food={reviewing}
				describe={reviewing?.describe ?? false}
				onClose={() => setReviewing(null)}
				onSaved={refresh}
			/>
		</div>
	)
}
