import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import type { TableExportDto } from '@/api/model'
import type { ExportField } from './@useOrdersExport'

interface OrdersPrintSheetProps {
	title: string
	tables: TableExportDto[]
	fields: Set<ExportField>
}

export function OrdersPrintSheet({
	title,
	tables,
	fields,
}: OrdersPrintSheetProps) {
	const { t } = useTranslation()
	const showHeading = fields.has('no') || fields.has('name')

	return createPortal(
		<div className='print-sheet hidden bg-paper p-8 font-sans text-paper-foreground print:block'>
			<header className='mb-6 flex items-baseline justify-between gap-4 border-b border-paper-border pb-3'>
				<h1 className='text-2xl font-bold'>{title}</h1>
				<span className='text-sm text-paper-muted'>
					{new Date().toLocaleString()}
				</span>
			</header>

			<div className='flex flex-col gap-5'>
				{tables.map(table => (
					<section
						key={table.id}
						className='break-inside-avoid border-b border-paper-border pb-4'
					>
						{showHeading && (
							<h2 className='mb-1 text-lg font-semibold'>
								{[
									fields.has('no') &&
										t('admin.export.table_no', { no: table.no }),
									fields.has('name') && table.name,
								]
									.filter(Boolean)
									.join(' · ')}
							</h2>
						)}
						{fields.has('host') && table.hostName && (
							<p className='text-sm'>
								<span className='text-paper-muted'>
									{t('admin.export.host')}:{' '}
								</span>
								{table.hostName}
							</p>
						)}
						{fields.has('people') && table.people.length > 0 && (
							<p className='text-sm'>
								<span className='text-paper-muted'>
									{t('admin.export.people')}:{' '}
								</span>
								{table.people.join(', ')}
							</p>
						)}
						{fields.has('foods') &&
							(table.foods.length > 0 ? (
								<ul className='mt-2 flex flex-col gap-0.5 text-sm'>
									{table.foods.map(food => (
										<li key={food.variantId} className='flex gap-2'>
											{fields.has('quantity') && (
												<span className='w-8 shrink-0 text-right font-semibold tabular-nums'>
													{food.quantity}×
												</span>
											)}
											<span>
												{food.foodName}
												{fields.has('variant') && food.variantLabel && (
													<span className='text-paper-muted'>
														{' '}
														({food.variantLabel})
													</span>
												)}
											</span>
										</li>
									))}
								</ul>
							) : (
								<p className='mt-2 text-sm text-paper-muted italic'>
									{t('admin.export.no_orders')}
								</p>
							))}
					</section>
				))}
			</div>
		</div>,
		document.body
	)
}
