import { useTranslation } from 'react-i18next'
import { useGetFoodById } from '@/api/foods/foods'
import type { FoodDetailDto, FoodVariantDto, TableWishDto } from '@/api/model'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { STALE_TIME_STATIC } from '@/common/constants'

interface WishVariantPickerProps {
	wish: TableWishDto
	onChange: (variant: FoodVariantDto) => void
}

/** Lets the table switch a planned dish to another size or option. */
export function WishVariantPicker({ wish, onChange }: WishVariantPickerProps) {
	const { t, i18n } = useTranslation()
	const { data: food } = useGetFoodById<FoodDetailDto>(
		wish.foodId ?? '',
		{ lang: i18n.language },
		{ query: { enabled: Boolean(wish.foodId), staleTime: STALE_TIME_STATIC } }
	)
	const variants = (food?.variants ?? []).filter(
		v => v.isAvailable || v.id === wish.variantId
	)

	if (variants.length < 2 || !wish.variantId) {
		return wish.variantLabel ? (
			<span className='shrink-0 text-sm text-muted-foreground'>
				{wish.variantLabel}
			</span>
		) : null
	}

	return (
		<Select
			value={wish.variantId}
			onValueChange={id => {
				const next = variants.find(v => v.id === id)
				if (next) onChange(next)
			}}
		>
			<SelectTrigger
				size='sm'
				aria-label={t('plan_board.change_option')}
				className='h-7 w-auto shrink-0 gap-1 rounded-full border-border/80 bg-muted/50 px-2.5 text-xs font-medium shadow-none hover:border-primary/40 hover:bg-primary/10'
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{variants.map(v => (
					<SelectItem key={v.id} value={v.id}>
						{v.label || t('admin.food.default_variant_label')}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
