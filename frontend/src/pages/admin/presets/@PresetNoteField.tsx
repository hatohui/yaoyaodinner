import { useTranslation } from 'react-i18next'
import { Gift, Languages, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DebouncedInput } from '@/components/common/DebouncedInput'
import { IncludedNoteStrip } from '@/components/common/IncludedNoteStrip'
import { LANGUAGES } from '@/components/common/LanguageSelector'
import type { PresetNoteTranslationDto } from '@/api/model'

interface PresetNoteFieldProps {
	note: string | null
	translations: PresetNoteTranslationDto[]
	translating: boolean
	onCommit: (note: string) => void
}

export function PresetNoteField({
	note,
	translations,
	translating,
	onCommit,
}: PresetNoteFieldProps) {
	const { t, i18n } = useTranslation()
	const otherLanguages = LANGUAGES.filter(l => l.code !== i18n.language)

	return (
		<div className='flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3'>
			<div className='flex items-start gap-2'>
				<Gift className='mt-0.5 size-4 shrink-0 text-primary' />
				<span className='flex-1 text-sm font-medium text-foreground'>
					{t('admin.presets.note_label')}
				</span>
				{note && (
					<Button
						size='sm'
						variant='ghost'
						className='-my-1 gap-1.5 rounded-full text-muted-foreground hover:text-destructive'
						onClick={() => onCommit('')}
					>
						<Trash2 className='size-4' />
						{t('admin.presets.note_remove')}
					</Button>
				)}
			</div>

			<DebouncedInput
				value={note ?? ''}
				onCommit={value => {
					if (value.trim() !== (note ?? '')) onCommit(value)
				}}
				placeholder={t('admin.presets.note_placeholder')}
				className='h-9 rounded-full'
			/>

			{note && (
				<>
					<IncludedNoteStrip note={note} />

					<div className='flex flex-col gap-1.5'>
						<span className='flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
							<Languages className='size-3.5' />
							{t('admin.presets.note_translations')}
							{translating && (
								<span className='flex items-center gap-1 font-normal'>
									<Loader2 className='size-3 animate-spin' />
									{t('admin.presets.note_translating')}
								</span>
							)}
						</span>
						<ul className='flex flex-col gap-1'>
							{otherLanguages.map(({ code, name }) => {
								const text = translations.find(tr => tr.language === code)?.note
								return (
									<li
										key={code}
										className='flex items-baseline gap-2 rounded-xl bg-muted/50 px-3 py-1.5 text-sm'
									>
										<span
											title={name}
											className='w-7 shrink-0 text-xs font-semibold uppercase text-muted-foreground'
										>
											{code}
										</span>
										{text ? (
											<span className='text-foreground'>{text}</span>
										) : (
											<span className='italic text-muted-foreground'>
												{t('admin.presets.note_untranslated')}
											</span>
										)}
									</li>
								)
							})}
						</ul>
					</div>
				</>
			)}
		</div>
	)
}
