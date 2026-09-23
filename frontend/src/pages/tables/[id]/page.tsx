import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft, Check, Pencil, Share2, Users } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useGetTablePeople } from '@/api/tables/tables'
import type { PersonDto } from '@/api/model'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useTableTab } from '@/hooks/useTableTab'
import { InlineEdit } from '@/components/common/InlineEdit'
import { EditableName } from '@/components/common/EditableName'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { StoredImage } from '@/components/common/StoredImage'
import { cn } from '@/utils/shadcn'
import { Roster } from './@Roster'
import { OrdersTab } from './@OrdersTab'
import { SplitsTab } from './@SplitsTab'
import { defaultBannerSrc } from '../@tableCardUtils'
import { useTableDetail } from './@useTableDetail'

const tabTrigger =
	'rounded-full text-foreground/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground'

export default function TableDetailPage() {
	const { t } = useTranslation()
	const {
		id,
		table,
		isLoading,
		isError,
		shareLink,
		updateTable,
		updateTableAdmin,
	} = useTableDetail()
	const { tab, setTab } = useTableTab(id)
	const { isAdmin } = useIsAdmin()
	const { data: people } = useGetTablePeople<PersonDto[]>(id)
	const [editing, setEditing] = useState(false)

	if (isLoading) {
		return (
			<div className='flex justify-center py-20'>
				<Spinner />
			</div>
		)
	}

	if (isError || !table) {
		return (
			<p className='py-20 text-center text-sm text-muted-foreground'>
				{t('roster.not_found')}
			</p>
		)
	}

	return (
		<div className='mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6'>
			<Link
				to='/tables'
				className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
			>
				<ArrowLeft className='size-4' />
				{t('tables.all_tables')}
			</Link>

			{editing ? (
				<ImageUploadSlot
					shape='banner'
					folder='table-banners'
					imageKey={table.bannerUrl}
					onChange={bannerUrl => updateTable({ bannerUrl })}
				/>
			) : (
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
			)}

			<div className='flex items-center justify-between gap-2'>
				<div className='flex min-w-0 items-center gap-2'>
					<h1 className='min-w-0 truncate text-xl font-bold text-foreground'>
						{editing ? (
							<EditableName
								value={table.name}
								onSave={name => updateTable({ name })}
							/>
						) : (
							table.name
						)}
					</h1>
					<span className='flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/25'>
						<Users className='size-3.5' />
						{table.seated} /
						{isAdmin && editing ? (
							<InlineEdit
								type='number'
								value={String(table.capacity)}
								onCommit={v => {
									const capacity = Number(v)
									if (capacity >= table.seated) updateTableAdmin({ capacity })
								}}
								inputClassName='w-14 text-xs'
							/>
						) : (
							table.capacity
						)}
					</span>
				</div>
				<div className='flex shrink-0 items-center gap-2'>
					<button
						type='button'
						onClick={() => setEditing(e => !e)}
						aria-pressed={editing}
						className={cn(
							'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
							editing
								? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
								: 'border-border bg-control text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
						)}
					>
						{editing ? (
							<Check className='size-4' />
						) : (
							<Pencil className='size-4' />
						)}
						{t(editing ? 'common.done' : 'common.edit')}
					</button>
					<button
						type='button'
						onClick={shareLink}
						className='inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-control px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
					>
						<Share2 className='size-4' />
						{t('roster.share')}
					</button>
				</div>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList className='h-10 w-full rounded-full border border-border bg-control p-1'>
					<TabsTrigger value='people' className={tabTrigger}>
						{t('tabs.people')}
					</TabsTrigger>
					<TabsTrigger value='orders' className={tabTrigger}>
						{t('tabs.orders')}
					</TabsTrigger>
					<TabsTrigger value='split' className={tabTrigger}>
						{t('tabs.splits')}
					</TabsTrigger>
				</TabsList>

				<TabsContent value='people'>
					<Roster
						table={table}
						editing={editing}
						onSetHost={personId => updateTable({ tableLeaderId: personId })}
					/>
				</TabsContent>
				<TabsContent value='orders'>
					<OrdersTab table={table} people={people ?? []} />
				</TabsContent>
				<TabsContent value='split'>
					<SplitsTab table={table} people={people ?? []} />
				</TabsContent>
			</Tabs>
		</div>
	)
}
