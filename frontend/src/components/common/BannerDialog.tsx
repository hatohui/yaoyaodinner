import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
	useUpdateConfig,
	getGetConfigQueryKey,
	getGetPublicConfigQueryKey,
} from '@/api/config/config'
import { useConfig } from '@/hooks/useConfig'
import { useToast } from '@/hooks/useToast'

interface BannerDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function BannerDialog({ open, onOpenChange }: BannerDialogProps) {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const { bannerEnabled, bannerMessage } = useConfig()

	const [enabled, setEnabled] = useState(bannerEnabled)
	const [message, setMessage] = useState(bannerMessage)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (open) {
			setEnabled(bannerEnabled)
			setMessage(bannerMessage)
		}
	}, [open, bannerEnabled, bannerMessage])

	const { mutateAsync: updateConfig } = useUpdateConfig()

	const handleSave = async () => {
		setSaving(true)
		try {
			await Promise.all([
				updateConfig({
					key: 'banner.enabled',
					data: { value: enabled ? 'true' : 'false' },
				}),
				updateConfig({
					key: 'banner.message',
					data: { value: message.trim() },
				}),
			])
			qc.invalidateQueries({ queryKey: getGetConfigQueryKey() })
			qc.invalidateQueries({ queryKey: getGetPublicConfigQueryKey() })
			toast.success(t('admin.settings.saved'))
			onOpenChange(false)
		} catch {
			toast.error(t('admin.settings.save_failed'))
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='rounded-3xl sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Megaphone className='size-5 text-primary' />
						{t('admin.settings.category_banner')}
					</DialogTitle>
					<DialogDescription>
						{t('banner.dialog_description', {
							defaultValue:
								'Broadcast an announcement banner to all guests at the top of every page.',
						})}
					</DialogDescription>
				</DialogHeader>

				<div className='flex flex-col gap-4 py-2'>
					<div className='flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3 shadow-2xs'>
						<div className='flex flex-col gap-0.5'>
							<Label
								htmlFor='banner-toggle'
								className='font-medium text-foreground cursor-pointer'
							>
								{t('banner.enable_banner', { defaultValue: 'Enable banner' })}
							</Label>
							<span className='text-xs text-muted-foreground'>
								{enabled
									? t('banner.visible_to_all', {
											defaultValue: 'Visible at the top of the app',
										})
									: t('banner.hidden', { defaultValue: 'Hidden from guests' })}
							</span>
						</div>
						<Switch
							id='banner-toggle'
							checked={enabled}
							onCheckedChange={setEnabled}
						/>
					</div>

					<div className='flex flex-col gap-1.5'>
						<Label
							htmlFor='banner-text'
							className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'
						>
							{t('banner.message_label', { defaultValue: 'Banner Message' })}
						</Label>
						<Textarea
							id='banner-text'
							rows={3}
							value={message}
							onChange={e => setMessage(e.target.value)}
							placeholder={t('banner.placeholder', {
								defaultValue:
									'e.g. YaoYao Dinner starts at 7:00 PM! Please finalize pre-orders.',
							})}
							className='rounded-2xl resize-none'
						/>
					</div>

					{message.trim() && (
						<div className='flex flex-col gap-1.5'>
							<span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
								{t('banner.preview', { defaultValue: 'Preview' })}
							</span>
							<div className='flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-sm font-medium text-foreground'>
								<Megaphone className='size-4 shrink-0 text-primary' />
								<p className='min-w-0 flex-1'>{message.trim()}</p>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className='gap-2 sm:gap-0'>
					<Button
						type='button'
						variant='outline'
						className='rounded-full'
						onClick={() => onOpenChange(false)}
					>
						{t('common.cancel')}
					</Button>
					<Button
						type='button'
						className='rounded-full'
						disabled={saving}
						onClick={handleSave}
					>
						{t('common.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
