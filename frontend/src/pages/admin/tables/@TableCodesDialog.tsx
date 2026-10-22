import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, KeyRound } from 'lucide-react'
import { useGetTables } from '@/api/tables/tables'
import type { TableListDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useToast } from '@/hooks/useToast'

const MAX_TABLES = 100

interface TableCodesDialogProps {
	codes: Record<string, string>
}

export function TableCodesDialog({ codes }: TableCodesDialogProps) {
	const { t } = useTranslation()
	const toast = useToast()
	const [open, setOpen] = useState(false)
	const { selectedEvent, scopedEventId } = useAdminEvents()
	const { data } = useGetTables<TableListDto>(
		{ page: 1, count: MAX_TABLES, eventId: scopedEventId },
		{ query: { enabled: open } }
	)
	const tables = (data?.tables ?? []).filter(tb => codes[tb.id])

	const copy = () => {
		navigator.clipboard?.writeText(
			tables.map(tb => `${tb.no}. ${tb.name}: ${codes[tb.id]}`).join('\n')
		)
		toast.success(t('admin.tables.codes_copied'))
	}

	return (
		<>
			<Button
				variant='outline'
				className='gap-1.5 rounded-full'
				onClick={() => setOpen(true)}
			>
				<KeyRound className='size-4' />
				{t('admin.tables.codes_sheet')}
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className='max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<KeyRound className='size-5 text-primary' />
							{t('admin.tables.codes_sheet')}
							{selectedEvent?.name && (
								<span className='font-normal text-muted-foreground'>
									· {selectedEvent.name}
								</span>
							)}
						</DialogTitle>
					</DialogHeader>

					{tables.length === 0 ? (
						<p className='py-8 text-center text-sm text-muted-foreground'>
							{t('admin.tables.codes_empty')}
						</p>
					) : (
						<ul className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
							{tables.map(tb => (
								<li
									key={tb.id}
									className='flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3'
								>
									<span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground'>
										{tb.no}
									</span>
									<span className='min-w-0 flex-1 truncate font-medium text-foreground'>
										{tb.name}
									</span>
									<span className='shrink-0 font-mono text-xl font-bold tracking-[0.2em] text-primary'>
										{codes[tb.id]}
									</span>
								</li>
							))}
						</ul>
					)}

					{tables.length > 0 && (
						<Button
							variant='outline'
							className='gap-1.5 self-end rounded-full'
							onClick={copy}
						>
							<Copy className='size-4' />
							{t('admin.tables.copy_codes')}
						</Button>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}
