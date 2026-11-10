import {
	getApiBase,
	getAssetBase,
	getBaseHtmlResponse,
	resolveLang,
	rewriteMetaResponse,
	type PagesContext,
	type SupportedLang,
} from '../_shared'

interface TableMetaDto {
	id: string
	no: number
	name: string
	seated: number
	bannerUrl: string | null
	tableLeaderName?: string | null
}

const DEFAULT_BANNERS = [
	'1.webp',
	'2.webp',
	'3.webp',
	'4.webp',
	'5.png',
	'6.png',
	'7.png',
]

function formatTableMeta(table: TableMetaDto, lang: SupportedLang) {
	const name = table.name?.trim()
	const host = table.tableLeaderName?.trim()
	const seated = table.seated ?? 0

	switch (lang) {
		case 'vi': {
			const title = name ? `Bàn ${table.no} · ${name}` : `Bàn ${table.no}`
			const hostText = host ? `Chủ bàn: ${host}` : 'Chưa có chủ bàn'
			const peopleText = `${seated} người`
			return { title, description: `${hostText} · ${peopleText}` }
		}
		case 'zh': {
			const title = name ? `${table.no} 号桌 · ${name}` : `${table.no} 号桌`
			const hostText = host ? `桌主：${host}` : '暂无主人'
			const peopleText = `${seated} 人`
			return { title, description: `${hostText} · ${peopleText}` }
		}
		case 'th': {
			const title = name ? `โต๊ะ ${table.no} · ${name}` : `โต๊ะ ${table.no}`
			const hostText = host ? `เจ้าภาพโต๊ะ: ${host}` : 'ยังไม่มีเจ้าภาพ'
			const peopleText = `${seated} คน`
			return { title, description: `${hostText} · ${peopleText}` }
		}
		case 'en':
		default: {
			const title = name ? `Table ${table.no} · ${name}` : `Table ${table.no}`
			const hostText = host ? `Table host: ${host}` : 'No host'
			const peopleText = seated === 1 ? '1 person' : `${seated} people`
			return { title, description: `${hostText} · ${peopleText}` }
		}
	}
}

function resolveBannerUrl(
	table: TableMetaDto,
	origin: string,
	assetBaseUrl: string
): string {
	if (table.bannerUrl) {
		return table.bannerUrl.startsWith('http')
			? table.bannerUrl
			: `${assetBaseUrl}/${table.bannerUrl}`
	}
	const index = (Math.max(table.no, 1) - 1) % DEFAULT_BANNERS.length
	return `${origin}/images/table-defaults/${DEFAULT_BANNERS[index]}`
}

export const onRequestGet = async (
	context: PagesContext
): Promise<Response> => {
	const url = new URL(context.request.url)
	const paramId = Array.isArray(context.params?.id)
		? context.params.id[0]
		: context.params?.id
	const pathnameId = url.pathname.match(/\/tables\/([^/?#]+)/)?.[1]
	const id = paramId || pathnameId

	const baseResponse = await getBaseHtmlResponse(context)

	if (!id || id === 'map') {
		return baseResponse
	}

	const apiBase = getApiBase(context.env)
	const assetBase = getAssetBase(context.env)

	try {
		const apiRes = await fetch(
			`${apiBase}/api/tables/${encodeURIComponent(id)}`,
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

		const table = (await apiRes.json()) as TableMetaDto
		const lang = resolveLang(
			url,
			context.request.headers.get('accept-language')
		)
		const { title, description } = formatTableMeta(table, lang)
		const imageUrl = resolveBannerUrl(table, url.origin, assetBase)

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
