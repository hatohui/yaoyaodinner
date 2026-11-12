import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import {
	useDraftFoodContent,
	useSaveFoodContent,
} from '@/api/content-health/content-health'
import type {
	FoodContentDto,
	FoodDraftDto,
	SaveFoodLocaleDtoLang,
} from '@/api/model'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'

interface FoodDraftDialogProps {
	food: { id: string; name: string } | null
	describe: boolean
	onClose: () => void
	onSaved: () => void
}

export function FoodDraftDialog({
	food,
	describe,
	onClose,
	onSaved,
}: FoodDraftDialogProps) {
	const { t } = useTranslation()
	const toast = useToast()
	const [draft, setDraft] = React.useState<FoodDraftDto | null>(null)
	const [values, setValues] = React.useState<Record<string, FoodContentDto>>({})
	const [edited, setEdited] = React.useState<Set<string>>(new Set())

	const {
		mutate: requestDraft,
		isPending: drafting,
		isError: draftFailed,
	} = useDraftFoodContent({
		mutation: {
			onSuccess: result => {
				setDraft(result)
				setValues(
					Object.fromEntries(result.locales.map(l => [l.lang, l.draft]))
				)
				setEdited(new Set())
			},
		},
	})
	const { mutate: save, isPending: saving } = useSaveFoodContent({
		mutation: {
			onSuccess: () => {
				toast.success(t('admin.content.fill_done'))
				onSaved()
				onClose()
			},
			onError: () => toast.error(t('admin.food.save_failed')),
		},
	})

	const fetchDraft = React.useCallback(
		(regenerate: boolean) => {
			if (food) requestDraft({ id: food.id, data: { describe, regenerate } })
		},
		[food, describe, requestDraft]
	)

	React.useEffect(() => {
		setDraft(null)
		fetchDraft(false)
	}, [fetchDraft])

	const update = (lang: string, patch: FoodContentDto) => {
		setValues(prev => ({ ...prev, [lang]: { ...prev[lang], ...patch } }))
		setEdited(prev => new Set(prev).add(lang))
	}

	const sourceLabel = (variantId: string) =>
		draft?.variants.find(v => v.id === variantId)?.label ?? ''

	const canSave = !drafting && !saving && Boolean(draft?.locales.length)

	return (
		<Dialog open={Boolean(food)} onOpenChange={open => !open && onClose()}>
			<DialogContent className='max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl'>
				<DialogHeader>
					<DialogTitle>{t('admin.content.review_title')}</DialogTitle>
					<DialogDescription>{food?.name}</DialogDescription>
				</DialogHeader>

				{drafting ? (
					<div className='flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground'>
						<Spinner />
						{t('admin.content.drafting')}
					</div>
				) : draftFailed ? (
					<p className='py-12 text-center text-sm text-destructive'>
						{t('admin.content.draft_failed')}
					</p>
				) : draft && draft.locales.length === 0 ? (
					<p className='py-12 text-center text-sm text-muted-foreground'>
						{t('admin.content.nothing_to_fill')}
					</p>
				) : (
					<div className='flex flex-col gap-4'>
						{draft?.locales.map(locale => {
							const value = values[locale.lang] ?? {}
							return (
								<section
									key={locale.lang}
									className='flex flex-col gap-3 rounded-2xl border border-border p-3'
								>
									<p className='text-xs font-semibold uppercase tracking-wide text-primary'>
										{locale.lang}
									</p>

									{locale.draft.name !== undefined && (
										<div className='flex flex-col gap-1.5'>
											<Label htmlFor={`draft-${locale.lang}-name`}>
												{t('admin.food.name')}
											</Label>
											<Input
												id={`draft-${locale.lang}-name`}
												value={value.name ?? ''}
												onChange={e =>
													update(locale.lang, { name: e.target.value })
												}
												className='rounded-full'
											/>
											{locale.current.name && (
												<p className='text-xs text-muted-foreground'>
													{t('admin.content.current', {
														value: locale.current.name,
													})}
												</p>
											)}
										</div>
									)}

									{locale.draft.description !== undefined && (
										<div className='flex flex-col gap-1.5'>
											<Label htmlFor={`draft-${locale.lang}-description`}>
												{t('admin.food.description')}
											</Label>
											<Textarea
												id={`draft-${locale.lang}-description`}
												value={value.description ?? ''}
												onChange={e =>
													update(locale.lang, { description: e.target.value })
												}
											/>
											{locale.current.description && (
												<p className='text-xs text-muted-foreground'>
													{t('admin.content.current', {
														value: locale.current.description,
													})}
												</p>
											)}
										</div>
									)}

									{(locale.draft.variants ?? []).map(variant => (
										<div key={variant.id} className='flex flex-col gap-1.5'>
											<Label htmlFor={`draft-${locale.lang}-${variant.id}`}>
												{t('admin.content.variant_label', {
													label: sourceLabel(variant.id),
												})}
											</Label>
											<Input
												id={`draft-${locale.lang}-${variant.id}`}
												value={
													value.variants?.find(v => v.id === variant.id)
														?.label ?? ''
												}
												onChange={e =>
													update(locale.lang, {
														variants: (value.variants ?? []).map(v =>
															v.id === variant.id
																? { ...v, label: e.target.value }
																: v
														),
													})
												}
												className='rounded-full'
											/>
										</div>
									))}
								</section>
							)
						})}
					</div>
				)}

				<DialogFooter>
					<Button
						variant='ghost'
						className='mr-auto gap-1.5 rounded-full'
						disabled={drafting || saving}
						onClick={() => fetchDraft(true)}
					>
						<RefreshCw />
						{t('admin.content.regenerate')}
					</Button>
					<Button variant='outline' className='rounded-full' onClick={onClose}>
						{t('common.cancel')}
					</Button>
					<Button
						className='rounded-full'
						disabled={!canSave}
						onClick={() =>
							food &&
							draft &&
							save({
								id: food.id,
								data: {
									locales: draft.locales.map(locale => ({
										lang: locale.lang as SaveFoodLocaleDtoLang,
										...values[locale.lang],
										isAiGenerated: !edited.has(locale.lang),
									})),
								},
							})
						}
					>
						{saving && <Spinner className='size-3.5' />}
						{t('common.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
