import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import type { CategoryItemDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from '@/components/ui/dialog'

interface CreateFoodDialogProps {
	categories: CategoryItemDto[]
	pending: boolean
	onCreate: (
		name: string,
		categoryId: string,
		price: number,
		imageUrl?: string
	) => void
}

export function CreateFoodDialog({
	categories,
	pending,
	onCreate,
}: CreateFoodDialogProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
	const [price, setPrice] = useState('')
	const [imageKey, setImageKey] = useState<string | null>(null)

	const reset = () => {
		setName('')
		setCategoryId(undefined)
		setPrice('')
		setImageKey(null)
	}

	const canCreate = name.trim() && categoryId

	return (
		<Dialog
			open={open}
			onOpenChange={next => {
				setOpen(next)
				if (!next) reset()
			}}
		>
			<DialogTrigger asChild>
				<Button size='sm' className='gap-1.5 rounded-full'>
					<Plus className='size-4' />
					{t('admin.food.create')}
				</Button>
			</DialogTrigger>
			<DialogContent className='rounded-3xl'>
				<DialogHeader>
					<DialogTitle>{t('admin.food.create_title')}</DialogTitle>
				</DialogHeader>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-1.5'>
						<Label>{t('admin.food.image')}</Label>
						<ImageUploadSlot
							shape='banner'
							folder='foods'
							aspect={4 / 3}
							imageKey={imageKey}
							onChange={setImageKey}
						/>
					</div>

					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='food-name'>{t('admin.food.name')}</Label>
						<Input
							id='food-name'
							value={name}
							onChange={e => setName(e.target.value)}
							className='rounded-full'
						/>
					</div>

					<div className='flex flex-col gap-1.5'>
						<Label>{t('admin.food.category')}</Label>
						<Select value={categoryId} onValueChange={setCategoryId}>
							<SelectTrigger className='w-full rounded-full'>
								<SelectValue placeholder={t('admin.food.category')} />
							</SelectTrigger>
							<SelectContent>
								{categories.map(c => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='food-price'>{t('admin.food.price')}</Label>
						<Input
							id='food-price'
							type='number'
							value={price}
							onChange={e => setPrice(e.target.value)}
							className='rounded-full'
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						className='rounded-full'
						disabled={!canCreate || pending}
						onClick={() => {
							if (!categoryId) return
							onCreate(
								name.trim(),
								categoryId,
								Number(price) || 0,
								imageKey ?? undefined
							)
							setOpen(false)
							reset()
						}}
					>
						{t('admin.food.create')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
