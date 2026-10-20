import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, Trash2 } from 'lucide-react'
import type { CategoryItemDto } from '@/api/model'
import type { FoodGridRow } from './@useFoodCatalog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CategoryChips } from '@/components/common/CategoryChips'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

interface EditFoodDialogProps {
	food: FoodGridRow
	categories: CategoryItemDto[]
	onSave: (next: FoodGridRow) => void
	onDelete: () => void
	onTranslate: () => void
	onClose: () => void
}

export function EditFoodDialog({
	food,
	categories,
	onSave,
	onDelete,
	onTranslate,
	onClose,
}: EditFoodDialogProps) {
	const { t } = useTranslation()
	const [draft, setDraft] = useState(food)
	const [confirmDelete, setConfirmDelete] = useState(false)

	const set = <K extends keyof FoodGridRow>(key: K, value: FoodGridRow[K]) =>
		setDraft(prev => ({ ...prev, [key]: value }))

	const flags = [
		['isAvailable', 'admin.food.available'],
		['isRecommended', 'admin.food.recommended'],
		['shouldCalculate', 'admin.food.calculated'],
	] as const

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent className='max-h-[90vh] overflow-y-auto rounded-3xl'>
				<DialogHeader>
					<DialogTitle>{t('admin.food.edit_title')}</DialogTitle>
				</DialogHeader>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-1.5'>
						<Label>{t('admin.food.image')}</Label>
						<ImageUploadSlot
							shape='banner'
							folder='foods'
							aspect={4 / 3}
							imageKey={draft.imageUrl}
							onChange={key => set('imageUrl', key)}
						/>
					</div>

					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='edit-food-name'>{t('admin.food.name')}</Label>
						<Input
							id='edit-food-name'
							value={draft.name}
							onChange={e => set('name', e.target.value)}
							className='rounded-full'
						/>
					</div>

					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='edit-food-description'>
							{t('admin.food.description')}
						</Label>
						<Textarea
							id='edit-food-description'
							value={draft.description ?? ''}
							onChange={e => set('description', e.target.value)}
						/>
					</div>

					<div className='flex flex-col gap-1.5'>
						<Label>{t('admin.food.category')}</Label>
						<CategoryChips
							categories={categories}
							value={draft.categoryId ?? undefined}
							onChange={id => set('categoryId', id)}
						/>
					</div>

					{draft.variantId && (
						<div className='flex flex-col gap-1.5'>
							<Label htmlFor='edit-food-price'>{t('admin.food.price')}</Label>
							<Input
								id='edit-food-price'
								type='number'
								value={draft.price ?? ''}
								onChange={e =>
									set(
										'price',
										e.target.value === '' ? null : Number(e.target.value)
									)
								}
								className='rounded-full'
							/>
						</div>
					)}

					<div className='flex flex-col gap-2'>
						{flags.map(([key, label]) => (
							<Label key={key} className='flex items-center justify-between'>
								{t(label)}
								<Switch
									checked={draft[key]}
									onCheckedChange={checked => set(key, checked)}
								/>
							</Label>
						))}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant='ghost'
						className='mr-auto gap-1.5 rounded-full text-muted-foreground hover:text-destructive'
						onClick={() => setConfirmDelete(true)}
					>
						<Trash2 />
						{t('admin.food.delete')}
					</Button>
					<Button
						variant='ghost'
						className='gap-1.5 rounded-full text-muted-foreground'
						onClick={() => {
							onTranslate()
							onClose()
						}}
					>
						<Languages />
						{t('admin.food.translations')}
					</Button>
					<Button variant='outline' className='rounded-full' onClick={onClose}>
						{t('common.cancel')}
					</Button>
					<Button
						className='rounded-full'
						disabled={!draft.name.trim()}
						onClick={() => {
							onSave(draft)
							onClose()
						}}
					>
						{t('common.save')}
					</Button>
				</DialogFooter>
			</DialogContent>

			<ConfirmDialog
				open={confirmDelete}
				onOpenChange={setConfirmDelete}
				title={t('admin.food.delete_title', { name: food.name })}
				description={t('admin.food.delete_desc')}
				confirmLabel={t('admin.food.delete')}
				onConfirm={() => {
					onDelete()
					onClose()
				}}
			/>
		</Dialog>
	)
}
