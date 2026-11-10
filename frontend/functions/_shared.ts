export interface Env {
	ASSETS: {
		fetch: (req: Request | URL | string) => Promise<Response>
	}
	VITE_API_URL?: string
	VITE_ASSET_URL?: string
}

export interface PagesContext {
	request: Request
	params: Record<string, string | string[] | undefined>
	env: Env
	next: () => Promise<Response>
}

interface RewriterElement {
	setAttribute: (name: string, value: string) => RewriterElement
	setInnerContent: (content: string) => RewriterElement
}

declare class HTMLRewriter {
	on(
		selector: string,
		handlers: { element?: (element: RewriterElement) => void }
	): HTMLRewriter
	transform(response: Response): Response
}

export type SupportedLang = 'en' | 'vi' | 'zh' | 'th'

const SUPPORTED_LANGS: readonly SupportedLang[] = ['en', 'vi', 'zh', 'th']

export const LOCALE_MAP: Record<SupportedLang, string> = {
	en: 'en_US',
	vi: 'vi_VN',
	zh: 'zh_CN',
	th: 'th_TH',
}

export function resolveLang(
	url: URL,
	acceptLanguage: string | null
): SupportedLang {
	const queryLang = url.searchParams.get('lang')?.toLowerCase().split('-')[0]
	if (queryLang && (SUPPORTED_LANGS as readonly string[]).includes(queryLang)) {
		return queryLang as SupportedLang
	}
	if (acceptLanguage) {
		for (const part of acceptLanguage.split(',')) {
			const code = part.split(';')[0]?.trim().toLowerCase().split('-')[0]
			if (code && (SUPPORTED_LANGS as readonly string[]).includes(code)) {
				return code as SupportedLang
			}
		}
	}
	return 'en'
}

export function getApiBase(env: Env): string {
	return (env.VITE_API_URL ?? 'https://api.yaoyaodinner.party').replace(
		/\/$/,
		''
	)
}

export function getAssetBase(env: Env): string {
	return (env.VITE_ASSET_URL ?? 'https://assets.yaoyaodinner.party').replace(
		/\/$/,
		''
	)
}

export async function getBaseHtmlResponse(
	context: PagesContext
): Promise<Response> {
	const res = await context.next()
	if (res.ok) return res
	return context.env.ASSETS.fetch(new URL('/', context.request.url))
}

export interface PageMetadata {
	lang: SupportedLang
	url: string
	title: string
	pageTitle?: string
	description: string
	imageUrl: string
}

export function rewriteMetaResponse(
	baseResponse: Response,
	meta: PageMetadata
): Response {
	const locale = LOCALE_MAP[meta.lang]
	const documentTitle =
		meta.pageTitle ?? `${meta.title} · YaoYao Furum After Gathering (FAG) 2026`

	const rewritten = new HTMLRewriter()
		.on('html', {
			element(el) {
				el.setAttribute('lang', meta.lang)
			},
		})
		.on('title', {
			element(el) {
				el.setInnerContent(documentTitle)
			},
		})
		.on('meta[name="description"]', {
			element(el) {
				el.setAttribute('content', meta.description)
			},
		})
		.on('meta[property="og:locale"]', {
			element(el) {
				el.setAttribute('content', locale)
			},
		})
		.on('meta[property="og:url"]', {
			element(el) {
				el.setAttribute('content', meta.url)
			},
		})
		.on('meta[property="og:title"]', {
			element(el) {
				el.setAttribute('content', meta.title)
			},
		})
		.on('meta[property="og:description"]', {
			element(el) {
				el.setAttribute('content', meta.description)
			},
		})
		.on('meta[property="og:image"]', {
			element(el) {
				el.setAttribute('content', meta.imageUrl)
			},
		})
		.on('meta[name="twitter:title"]', {
			element(el) {
				el.setAttribute('content', meta.title)
			},
		})
		.on('meta[name="twitter:description"]', {
			element(el) {
				el.setAttribute('content', meta.description)
			},
		})
		.on('meta[name="twitter:image"]', {
			element(el) {
				el.setAttribute('content', meta.imageUrl)
			},
		})
		.transform(baseResponse)

	const headers = new Headers(rewritten.headers)
	headers.set(
		'Cache-Control',
		'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
	)
	return new Response(rewritten.body, {
		status: rewritten.status,
		statusText: rewritten.statusText,
		headers,
	})
}
