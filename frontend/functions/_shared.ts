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
	next: (input?: Request | string, init?: RequestInit) => Promise<Response>
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
	const rootUrl = new URL('/', context.request.url).toString()
	try {
		const res = await context.next(new Request(rootUrl, context.request))
		if (res.ok) return res
	} catch {
		// Ignore and try next strategy
	}

	try {
		const res = await context.next()
		if (res.ok) return res
	} catch {
		// Ignore and try next strategy
	}

	if (context.env?.ASSETS?.fetch) {
		try {
			const res = await context.env.ASSETS.fetch(
				new URL('/', context.request.url)
			)
			if (res.ok) return res
		} catch {
			// Ignore and fall back to minimal shell
		}
	}

	return new Response(
		'<!doctype html><html><head><title>Furum After Gathering</title><meta name="description" content="Furum After Gathering — A private post-Furum gathering hosted by Yao Yao" /><meta property="og:title" content="Furum After Gathering" /><meta property="og:description" content="A private post-Furum gathering hosted by Yao Yao" /><meta property="og:image" content="https://yaoyaodinner.party/images/banner.png" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="Furum After Gathering" /><meta name="twitter:description" content="A private post-Furum gathering hosted by Yao Yao" /><meta name="twitter:image" content="https://yaoyaodinner.party/images/banner.png" /></head><body><div id="root"></div></body></html>',
		{
			headers: { 'Content-Type': 'text/html; charset=utf-8' },
			status: 200,
		}
	)
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
		meta.pageTitle ?? `${meta.title} · Furum After Gathering`

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
		status: 200,
		statusText: 'OK',
		headers,
	})
}
