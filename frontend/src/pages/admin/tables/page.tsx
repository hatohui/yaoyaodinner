import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Map } from 'lucide-react'
import { SearchBar } from '@/components/common/SearchBar'
import { PaginationBar } from '@/components/common/PaginationBar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CreateTableDialog } from './@CreateTableDialog'
import { BulkCreateDialog } from './@BulkCreateDialog'
import { TableListSection } from './@TableListSection'
import { useAdminTables } from './@useAdminTables'

export default function AdminTablesPage() {
	const { t } = useTranslation()
	const {
		search,
		setSearch,
		pagination,
		liveTables,
		liveLoading,
		stagedTables,
		stagedLoading,
		creating,
		bulkCreating,
		createTable,
		bulkCreate,
		bulkRemoveTables,
		moveToStaging,
		renameTable,
		updateCapacity,
	} = useAdminTables()

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.tables.title')}
				</h1>
				<div className='flex flex-wrap items-center gap-2'>
					<Link
						to='/admin/tables/map'
						className='inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground'
					>
						<Map className='size-4' />
						{t('floor_plan.title')}
					</Link>
					<BulkCreateDialog pending={bulkCreating} onCreate={bulkCreate} />
					<CreateTableDialog pending={creating} onCreate={createTable} />
				</div>
			</div>

			<Tabs defaultValue='live'>
				<TabsList>
					<TabsTrigger value='live'>{t('admin.tables.live')}</TabsTrigger>
					<TabsTrigger value='staged'>{t('admin.tables.staged')}</TabsTrigger>
				</TabsList>

				<TabsContent value='live' className='flex flex-col gap-4'>
					<SearchBar
						value={search}
						onChange={setSearch}
						placeholder={t('tables.search_placeholder')}
					/>
					<TableListSection
						tables={liveTables}
						isLoading={liveLoading}
						showMoveToStaging
						onRename={renameTable}
						onCapacityChange={updateCapacity}
						onBulkDelete={bulkRemoveTables}
						onMoveToStaging={moveToStaging}
					/>
					<div className='flex justify-center'>
						<PaginationBar pagination={pagination} />
					</div>
				</TabsContent>

				<TabsContent value='staged'>
					<TableListSection
						tables={stagedTables}
						isLoading={stagedLoading}
						onRename={renameTable}
						onCapacityChange={updateCapacity}
						onBulkDelete={bulkRemoveTables}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}
