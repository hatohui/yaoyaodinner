import {
	getApiBase,
	getAssetBase,
	getBaseHtmlResponse,
	resolveLang,
	rewriteMetaResponse,
	type PagesContext,
	type SupportedLang,
} from '../_shared'

interface FoodVariantMetaDto {
	id: string
	label: string
	price: number | null
	currency: string
	isSeasonal: boolean
	isAvailable: boolean
}

interface FoodMetaDto {
	id: string
	name: string
	imageUrl: string | null
	description: string | null
	isPopular: boolean
	isRecommended: boolean
	variants: FoodVariantMetaDto[]
}

const FOOD_LABELS: Record<
	SupportedLang,
	{ seasonal: string; popular: string; recommended: string }
> = {
	en: {
		seasonal: 'Seasonal price',
		popular: 'Popular',
		recommended: 'Recommended',
	},
	vi: {
		seasonal: 'Giá theo mùa',
		popular: 'Phổ biến',
		recommended: 'Đề xuất',
	},
	zh: {
		seasonal: '时价',
		popular: '热门',
		recommended: '推荐',
	},
	th: {
		seasonal: 'ราคาตามฤดูกาล',
		popular: 'ยอดนิยม',
		recommended: 'แนะนำ',
	},
}

function formatFoodDescription(food: FoodMetaDto, lang: SupportedLang): string {
	const labels = FOOD_LABELS[lang]
	const activeVariants = (food.variants ?? []).filter(v => v.isAvailable)
	const variants =
		activeVariants.length > 0 ? activeVariants : (food.variants ?? [])

	const variantParts = variants.map(v => {
		const isSeasonal = v.isSeasonal || !v.price || v.price <= 0
		const priceText = isSeasonal
			? labels.seasonal
			: `${v.price} ${v.currency || 'RM'}`
		const label = v.label?.trim()
		return label && variants.length > 1 ? `${label} ${priceText}` : priceText
	})

	const badges: string[] = []
	if (food.isPopular) badges.push(labels.popular)
	if (food.isRecommended) badges.push(labels.recommended)

	const metaLine = [...variantParts, ...badges].join(' · ')
	const desc = food.description?.trim()

	if (metaLine && desc) return `${metaLine} — ${desc}`
	return metaLine || desc || '高人馆 · Gao Ren Guan'
}

function resolveFoodImageUrl(
	food: FoodMetaDto,
	origin: string,
	assetBaseUrl: string
): string {
	if (food.imageUrl) {
		return food.imageUrl.startsWith('http')
			? food.imageUrl
			: `${assetBaseUrl}/${food.imageUrl}`
	}
	return `${origin}/images/banner.png`
}

export const onRequestGet = async (
	context: PagesContext
): Promise<Response> => {
	const url = new URL(context.request.url)
	const paramId = Array.isArray(context.params?.id)
		? context.params.id[0]
		: context.params?.id
	const pathnameId = url.pathname.match(/\/menu\/([^/?#]+)/)?.[1]
	const id = paramId || pathnameId
	const baseResponse = await getBaseHtmlResponse(context)

	if (!id) {
		return baseResponse
	}

	const lang = resolveLang(url, context.request.headers.get('accept-language'))
	const apiBase = getApiBase(context.env)
	const assetBase = getAssetBase(context.env)

	try {
		const apiRes = await fetch(
			`${apiBase}/api/foods/${encodeURIComponent(id)}?lang=${encodeURIComponent(lang)}`,
			{
				headers: {
					Accept: 'application/json',
					'User-Agent': 'YaoYaoDinner-Cloudflare-Worker/1.0',
				},
			}
		)
		if (!apiRes.ok) {
			return baseResponse
		}

		const food = (await apiRes.json()) as FoodMetaDto
		const title = food.name?.trim() || 'Furum After Gathering'
		const description = formatFoodDescription(food, lang)
		const imageUrl = resolveFoodImageUrl(food, url.origin, assetBase)

		return rewriteMetaResponse(baseResponse, {
			lang,
			url: url.toString(),
			title,
			description,
			imageUrl,
		})
	} catch {
		return baseResponse
	}
}
