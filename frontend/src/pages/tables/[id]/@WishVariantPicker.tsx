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
			<span className='inline-flex h-5 shrink-0 items-center rounded-md border border-border/60 bg-muted/40 px-1.5 text-[11px] font-medium text-muted-foreground'>
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
				className="relative inline-flex h-5 w-auto shrink-0 gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0 text-[11px] font-medium text-muted-foreground shadow-none after:absolute after:-inset-x-1 after:-inset-y-1.5 after:content-[''] hover:border-primary/40 hover:bg-primary/10 hover:text-primary data-[size=sm]:h-5 dark:bg-muted/40 dark:hover:bg-primary/10 sm:after:hidden [&_svg]:size-3 [&_svg]:text-current"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent align='start' className='min-w-24'>
				{variants.map(v => (
					<SelectItem
						key={v.id}
						value={v.id}
						className='py-1 pr-7 pl-2 text-xs'
					>
						{v.label || t('admin.food.default_variant_label')}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
