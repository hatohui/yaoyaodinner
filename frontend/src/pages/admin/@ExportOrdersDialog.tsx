import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { OrdersPrintSheet } from './@OrdersPrintSheet'
import { EXPORT_FIELDS, useOrdersExport } from './@useOrdersExport'

interface ExportOrdersDialogProps {
	eventName: string
}

export function ExportOrdersDialog({ eventName }: ExportOrdersDialogProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const {
		tables,
		isLoading,
		fields,
		toggleField,
		excluded,
		toggleTable,
		toggleAllTables,
		printable,
		print,
	} = useOrdersExport(open, eventName)

	const needsFoods = (field: string) =>
		(field === 'variant' || field === 'quantity') && !fields.has('foods')

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant='outline' className='gap-1.5 rounded-full'>
					<FileDown className='size-4' />
					{t('admin.export.button')}
				</Button>
			</DialogTrigger>
			<DialogContent className='flex max-h-[85vh] flex-col rounded-3xl sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{t('admin.export.title')}</DialogTitle>
					<DialogDescription>{t('admin.export.desc')}</DialogDescription>
				</DialogHeader>

				<div className='flex flex-col gap-2'>
					<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
						{t('admin.export.include')}
					</p>
					<div className='grid grid-cols-2 gap-2'>
						{EXPORT_FIELDS.map(field => (
							<Label
								key={field}
								className='cursor-pointer rounded-xl border border-border/60 px-3 py-2.5'
							>
								<Checkbox
									checked={fields.has(field)}
									disabled={needsFoods(field)}
									onCheckedChange={() => toggleField(field)}
								/>
								{t(`admin.export.field_${field}`)}
							</Label>
						))}
					</div>
				</div>

				<div className='flex min-h-0 flex-col gap-2'>
					<div className='flex items-center justify-between gap-2'>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
							{t('admin.export.tables', {
								count: printable.length,
								total: tables.length,
							})}
						</p>
						{tables.length > 0 && (
							<Button
								size='sm'
								variant='ghost'
								className='h-7 rounded-full text-xs'
								onClick={toggleAllTables}
							>
								{printable.length === tables.length
									? t('admin.export.select_none')
									: t('admin.tables.select_all')}
							</Button>
						)}
					</div>
					{isLoading ? (
						<div className='flex justify-center py-6'>
							<Spinner />
						</div>
					) : tables.length === 0 ? (
						<p className='py-4 text-center text-sm text-muted-foreground'>
							{t('admin.tables.empty')}
						</p>
					) : (
						<ul className='scrollbar-thin -mx-1 flex max-h-56 flex-col overflow-y-auto'>
							{tables.map(table => (
								<li key={table.id}>
									<Label className='cursor-pointer rounded-xl px-2 py-2 font-normal hover:bg-muted/50'>
										<Checkbox
											checked={!excluded.has(table.id)}
											onCheckedChange={() => toggleTable(table.id)}
										/>
										<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
											{table.no}
										</span>
										<span className='min-w-0 flex-1 truncate'>
											{table.name}
										</span>
										<span className='shrink-0 text-xs text-muted-foreground'>
											{t('admin.export.food_count', {
												count: table.foods.length,
											})}
										</span>
									</Label>
								</li>
							))}
						</ul>
					)}
				</div>

				<DialogFooter>
					<Button
						className='gap-1.5 rounded-full'
						disabled={printable.length === 0 || fields.size === 0}
						onClick={print}
					>
						<FileDown className='size-4' />
						{t('admin.export.save')}
					</Button>
				</DialogFooter>

				{open && (
					<OrdersPrintSheet
						title={eventName}
						tables={printable}
						fields={fields}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
