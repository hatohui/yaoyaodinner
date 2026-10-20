import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Copy, KeyRound, Lock, RefreshCw } from 'lucide-react'
import {
	getGetTableCodeQueryKey,
	useGetTableCode,
	useRerollTableCode,
} from '@/api/tables/tables'
import type { TableCodeResponseDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableCodeForm } from '@/components/common/TableCodeForm'
import { useToast } from '@/hooks/useToast'

interface TableCodeBarProps {
	tableId: string
	canEdit: boolean
	isAdmin: boolean
}

export function TableCodeBar({ tableId, canEdit, isAdmin }: TableCodeBarProps) {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const [unlocking, setUnlocking] = useState(false)
	const [confirmReroll, setConfirmReroll] = useState(false)

	const { data: adminCode } = useGetTableCode<TableCodeResponseDto>(tableId, {
		query: { enabled: isAdmin },
	})
	const { mutate: reroll } = useRerollTableCode({
		mutation: {
			onSuccess: res => {
				qc.setQueryData(getGetTableCodeQueryKey(tableId), res)
				toast.success(t('table_code.rerolled'))
			},
			onError: () => toast.error(t('table_code.reroll_failed')),
		},
	})

	if (!canEdit) {
		return (
			<>
				<div className='flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3'>
					<p className='flex items-start gap-2 text-sm text-foreground'>
						<Lock className='mt-0.5 size-4 shrink-0 text-primary' />
						{t('table_code.locked')}
					</p>
					<Button
						size='sm'
						className='shrink-0 rounded-full'
						onClick={() => setUnlocking(true)}
					>
						{t('table_code.enter')}
					</Button>
				</div>

				<Dialog open={unlocking} onOpenChange={setUnlocking}>
					<DialogContent className='rounded-3xl sm:max-w-sm'>
						<DialogHeader className='items-center text-center'>
							<DialogTitle>{t('table_code.title')}</DialogTitle>
							<DialogDescription>{t('table_code.subtitle')}</DialogDescription>
						</DialogHeader>
						<TableCodeForm
							tableId={tableId}
							autoFocus
							onUnlock={() => {
								setUnlocking(false)
								toast.success(t('table_code.unlocked'))
							}}
						/>
					</DialogContent>
				</Dialog>
			</>
		)
	}

	if (!isAdmin) return null

	const shown = adminCode?.code
	if (!shown) return null

	const copy = () => {
		navigator.clipboard?.writeText(shown)
		toast.success(t('table_code.copied'))
	}

	return (
		<div className='flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm'>
			<div className='flex min-w-0 items-center gap-3'>
				<div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-primary'>
					<KeyRound className='size-4' />
				</div>
				<div className='min-w-0'>
					<p className='text-xs text-muted-foreground'>
						{t('table_code.label')}
					</p>
					<p className='font-bold tracking-[0.3em] text-foreground'>{shown}</p>
				</div>
			</div>
			<div className='flex shrink-0 items-center gap-1.5'>
				<Button
					variant='outline'
					size='sm'
					className='gap-1.5 rounded-full'
					onClick={() => setConfirmReroll(true)}
					aria-label={t('table_code.reroll')}
				>
					<RefreshCw className='size-3.5' />
					<span className='hidden sm:inline'>{t('table_code.reroll')}</span>
				</Button>
				<Button
					variant='outline'
					size='sm'
					className='gap-1.5 rounded-full'
					onClick={copy}
					aria-label={t('table_code.copy')}
				>
					<Copy className='size-3.5' />
					<span className='hidden sm:inline'>{t('table_code.copy')}</span>
				</Button>
			</div>

			<ConfirmDialog
				open={confirmReroll}
				onOpenChange={setConfirmReroll}
				title={t('table_code.reroll_confirm_title')}
				description={t('table_code.reroll_confirm_body', { code: shown })}
				confirmLabel={t('table_code.reroll')}
				onConfirm={() => {
					reroll({ id: tableId })
					setConfirmReroll(false)
				}}
			/>
		</div>
	)
}
