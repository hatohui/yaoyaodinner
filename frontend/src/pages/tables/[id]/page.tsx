import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft, Share2, Users } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useGetTablePeople } from '@/api/tables/tables'
import type { PersonDto } from '@/api/model'
import { useGuest } from '@/hooks/useGuest'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useTableTab } from '@/hooks/useTableTab'
import { InlineEdit } from '@/components/common/InlineEdit'
import { EditableName } from '@/components/common/EditableName'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { Roster } from './@Roster'
import { OrdersTab } from './@OrdersTab'
import { SplitsTab } from './@SplitsTab'
import { useTableDetail } from './@useTableDetail'

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
	const setActiveTable = useGuest(s => s.setActiveTable)
	const { tab, setTab } = useTableTab(id)
	const { isAdmin } = useIsAdmin()
	const { data: people } = useGetTablePeople<PersonDto[]>(id)

	useEffect(() => {
		if (id) setActiveTable(id)
	}, [id, setActiveTable])

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

			<ImageUploadSlot
				shape='banner'
				folder='table-banners'
				imageKey={table.bannerUrl}
				onChange={bannerUrl => updateTable({ bannerUrl })}
			/>

			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<h1 className='text-xl font-bold text-foreground'>
						<EditableName
							value={table.name}
							onSave={name => updateTable({ name })}
						/>
					</h1>
					<span className='flex items-center gap-1 rounded-full bg-brand-muted px-2.5 py-1 text-xs font-medium text-primary'>
						<Users className='size-3.5' />
						{table.seated} /
						{isAdmin ? (
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
				<button
					type='button'
					onClick={shareLink}
					className='inline-flex items-center cursor-pointer gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
				>
					<Share2 className='size-4' />
					{t('roster.share')}
				</button>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList className='w-full'>
					<TabsTrigger value='people'>{t('tabs.people')}</TabsTrigger>
					<TabsTrigger value='orders'>{t('tabs.orders')}</TabsTrigger>
					<TabsTrigger value='split'>{t('tabs.splits')}</TabsTrigger>
				</TabsList>

				<TabsContent value='people'>
					<Roster
						table={table}
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
