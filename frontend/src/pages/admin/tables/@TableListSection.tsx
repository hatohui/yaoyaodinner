import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import {
	Users,
	Trash2,
	ArchiveRestore,
	ArrowLeftRight,
	KeyRound,
	Copy,
	ChevronRight,
	EllipsisVertical,
} from 'lucide-react'
import type { TableDto } from '@/api/model'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EditableName } from '@/components/common/EditableName'
import { InlineEdit } from '@/components/common/InlineEdit'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/shadcn'
import { TableCodeChip } from './@TableCodeChip'
import { SwapNumberDialog } from './@SwapNumberDialog'

interface TableListSectionProps {
	tables: TableDto[]
	isLoading: boolean
	showMoveToStaging?: boolean
	codes: Record<string, string>
	onRename: (id: string, name: string) => void
	onCapacityChange: (id: string, capacity: number) => void
	onBulkDelete: (ids: string[]) => void
	onRerollCodes: (ids: string[]) => void
	onMoveToStaging?: (ids: string[]) => void
	onSwapNumbers: (ids: string[]) => void
}

export function TableListSection({
	tables,
	isLoading,
	showMoveToStaging,
	codes,
	onRename,
	onCapacityChange,
	onBulkDelete,
	onRerollCodes,
	onMoveToStaging,
	onSwapNumbers,
}: TableListSectionProps) {
	const { t } = useTranslation()
	const toast = useToast()
	const navigate = useNavigate()
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [rerollIds, setRerollIds] = useState<string[] | null>(null)
	const [swapping, setSwapping] = useState<TableDto | null>(null)

	const toggle = (id: string) => {
		setSelected(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const toggleAll = () => {
		setSelected(prev =>
			prev.size === tables.length ? new Set() : new Set(tables.map(t => t.id))
		)
	}

	const copyCodes = () => {
		const lines = tables
			.filter(tb => selected.has(tb.id) && codes[tb.id])
			.map(tb => `${tb.no}. ${tb.name}: ${codes[tb.id]}`)
		navigator.clipboard?.writeText(lines.join('\n'))
		toast.success(t('admin.tables.codes_copied'))
	}

	if (isLoading) {
		return (
			<div className='flex justify-center py-10'>
				<Spinner />
			</div>
		)
	}

	if (tables.length === 0) {
		return (
			<p className='py-6 text-center text-sm text-muted-foreground'>
				{t('admin.tables.empty')}
			</p>
		)
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center gap-2'>
				<Checkbox
					checked={selected.size > 0 && selected.size === tables.length}
					onCheckedChange={toggleAll}
				/>
				<span className='text-xs text-muted-foreground'>
					{selected.size > 0
						? t('admin.tables.selected_count', { count: selected.size })
						: t('admin.tables.select_all')}
				</span>
			</div>

			<ul className='grid gap-2 sm:grid-cols-2'>
				{tables.map(table => {
					const full = table.seated >= table.capacity
					const detail = `/tables/${table.id}`
					return (
						<li
							key={table.id}
							onClick={e => {
								const target = e.target as HTMLElement
								if (!target.closest('button, input, a'))
									navigate(detail, { state: { backTo: '/admin/tables' } })
							}}
							className={cn(
								'flex cursor-pointer items-center gap-3 rounded-2xl border bg-card py-3 pr-2 pl-4 shadow-sm transition-colors hover:border-primary/40',
								selected.has(table.id)
									? 'border-primary/60'
									: 'border-border/60'
							)}
						>
							<Checkbox
								checked={selected.has(table.id)}
								onCheckedChange={() => toggle(table.id)}
							/>
							<div className='flex min-w-0 flex-1 flex-col gap-2'>
								<span className='flex min-w-0 items-center gap-2'>
									<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
										{table.no}
									</span>
									<EditableName
										value={table.name}
										onSave={name => onRename(table.id, name)}
										className='font-semibold text-foreground'
									/>
								</span>
								<span className='flex flex-wrap items-center gap-2 pl-8'>
									<TableCodeChip
										code={codes[table.id]}
										onReroll={() => setRerollIds([table.id])}
									/>
									<span
										className={cn(
											'flex h-7 items-center gap-1 rounded-full pl-2.5 pr-1 text-xs font-medium tabular-nums',
											full
												? 'bg-muted text-muted-foreground'
												: 'bg-brand-muted text-primary'
										)}
									>
										<Users className='size-3.5' />
										{table.seated} /
										<InlineEdit
											alwaysEditable
											type='number'
											value={String(table.capacity)}
											onCommit={v => {
												const capacity = Number(v)
												if (capacity >= table.seated)
													onCapacityChange(table.id, capacity)
											}}
											inputClassName='h-5 w-10 rounded-full border-solid border-border bg-card px-1 py-0 text-xs font-semibold shadow-none'
										/>
									</span>
								</span>
							</div>
							<DropdownMenu modal={false}>
								<DropdownMenuTrigger asChild>
									<button
										type='button'
										aria-label={t('admin.tables.more_actions')}
										title={t('admin.tables.more_actions')}
										className='flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'
									>
										<EllipsisVertical className='size-4' />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align='end'
									onClick={e => e.stopPropagation()}
								>
									<DropdownMenuItem onSelect={() => setSwapping(table)}>
										<ArrowLeftRight />
										{t('admin.tables.swap_with')}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<Link
								to={detail}
								state={{ backTo: '/admin/tables' }}
								aria-label={t('admin.tables.open_table')}
								title={t('admin.tables.open_table')}
								className='flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'
							>
								<ChevronRight className='size-4' />
							</Link>
						</li>
					)
				})}
			</ul>

			{selected.size > 0 && (
				<div className='fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2.5 shadow-lg'>
					<span className='text-sm font-medium whitespace-nowrap text-foreground'>
						{t('admin.tables.selected_count', { count: selected.size })}
					</span>
					{showMoveToStaging && onMoveToStaging && (
						<Button
							size='sm'
							variant='outline'
							className='gap-1.5 rounded-full'
							aria-label={t('admin.tables.move_to_staging')}
							onClick={() => {
								onMoveToStaging([...selected])
								setSelected(new Set())
							}}
						>
							<ArchiveRestore className='size-3.5' />
							<span className='hidden sm:inline'>
								{t('admin.tables.move_to_staging')}
							</span>
						</Button>
					)}
					{selected.size === 2 && (
						<Button
							size='sm'
							variant='outline'
							className='gap-1.5 rounded-full'
							aria-label={t('admin.tables.swap_numbers')}
							title={t('admin.tables.swap_numbers')}
							onClick={() => {
								onSwapNumbers([...selected])
								setSelected(new Set())
							}}
						>
							<ArrowLeftRight className='size-3.5' />
							<span className='hidden sm:inline'>
								{t('admin.tables.swap_numbers')}
							</span>
						</Button>
					)}
					<Button
						size='sm'
						variant='outline'
						className='gap-1.5 rounded-full'
						onClick={copyCodes}
						aria-label={t('admin.tables.copy_codes')}
					>
						<Copy className='size-3.5' />
						<span className='hidden sm:inline'>
							{t('admin.tables.copy_codes')}
						</span>
					</Button>
					<Button
						size='sm'
						variant='outline'
						className='gap-1.5 rounded-full'
						onClick={() => setRerollIds([...selected])}
						aria-label={t('admin.tables.reroll_codes')}
					>
						<KeyRound className='size-3.5' />
						<span className='hidden sm:inline'>
							{t('admin.tables.reroll_codes')}
						</span>
					</Button>
					<Button
						size='sm'
						variant='destructive'
						className='gap-1.5 rounded-full'
						aria-label={t('admin.tables.delete_selected')}
						onClick={() => setConfirmOpen(true)}
					>
						<Trash2 className='size-3.5' />
						<span className='hidden sm:inline'>
							{t('admin.tables.delete_selected')}
						</span>
					</Button>
				</div>
			)}

			<SwapNumberDialog
				table={swapping}
				onOpenChange={open => !open && setSwapping(null)}
				onSwap={onSwapNumbers}
			/>

			<ConfirmDialog
				open={rerollIds !== null}
				onOpenChange={open => !open && setRerollIds(null)}
				title={t('admin.tables.reroll_codes_title', {
					count: rerollIds?.length ?? 0,
				})}
				description={t('admin.tables.reroll_codes_desc')}
				confirmLabel={t('table_code.reroll')}
				onConfirm={() => {
					if (rerollIds) onRerollCodes(rerollIds)
					setRerollIds(null)
				}}
			/>

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title={t('admin.tables.bulk_delete_title', { count: selected.size })}
				description={t('admin.tables.bulk_delete_desc')}
				confirmLabel={t('admin.tables.delete_selected')}
				onConfirm={() => {
					onBulkDelete([...selected])
					setSelected(new Set())
					setConfirmOpen(false)
				}}
			/>
		</div>
	)
}
