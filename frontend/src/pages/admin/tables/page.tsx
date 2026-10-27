import { useTranslation } from 'react-i18next'
import { SearchBar } from '@/components/common/SearchBar'
import { PaginationBar } from '@/components/common/PaginationBar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CreateTableDialog } from './@CreateTableDialog'
import { BulkCreateDialog } from './@BulkCreateDialog'
import { TableListSection } from './@TableListSection'
import { TableCodesDialog } from './@TableCodesDialog'
import { PeopleOverview } from './@PeopleOverview'
import { useAdminTables } from './@useAdminTables'
import { useConfig } from '@/hooks/useConfig'

export default function AdminTablesPage() {
	const { t } = useTranslation()
	const { tableCodes } = useConfig()
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
		rerollCodes,
		codes,
		moveToStaging,
		renameTable,
		updateCapacity,
		swapNumbers,
	} = useAdminTables()

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.tables.title')}
				</h1>
				<div className='flex flex-wrap items-center gap-2'>
					{tableCodes && <TableCodesDialog codes={codes} />}
					<BulkCreateDialog pending={bulkCreating} onCreate={bulkCreate} />
					<CreateTableDialog pending={creating} onCreate={createTable} />
				</div>
			</div>

			<Tabs defaultValue='live'>
				<TabsList>
					<TabsTrigger value='live'>{t('admin.tables.live')}</TabsTrigger>
					<TabsTrigger value='staged'>{t('admin.tables.staged')}</TabsTrigger>
					<TabsTrigger value='people'>
						{t('admin.tables.people_tab')}
					</TabsTrigger>
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
						codes={codes}
						showMoveToStaging
						onRename={renameTable}
						onCapacityChange={updateCapacity}
						onBulkDelete={bulkRemoveTables}
						onRerollCodes={rerollCodes}
						onSwapNumbers={swapNumbers}
						onMoveToStaging={moveToStaging}
					/>
					<div className='flex justify-center'>
						<PaginationBar pagination={pagination} />
					</div>
				</TabsContent>

				<TabsContent value='people' className='flex flex-col gap-4'>
					<SearchBar
						value={search}
						onChange={setSearch}
						placeholder={t('tables.search_placeholder')}
					/>
					<PeopleOverview search={search} />
				</TabsContent>

				<TabsContent value='staged'>
					<TableListSection
						tables={stagedTables}
						isLoading={stagedLoading}
						codes={codes}
						onRename={renameTable}
						onCapacityChange={updateCapacity}
						onBulkDelete={bulkRemoveTables}
						onRerollCodes={rerollCodes}
						onSwapNumbers={swapNumbers}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}
