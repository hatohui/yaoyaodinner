import {
	getBaseHtmlResponse,
	resolveLang,
	rewriteMetaResponse,
	type PagesContext,
	type SupportedLang,
} from './_shared'

const FEEDBACK_TITLES: Record<SupportedLang, string> = {
	en: 'Feedback Wall',
	vi: 'Bảng góp ý',
	zh: '反馈墙',
	th: 'กระดานความคิดเห็น',
}

const FEEDBACK_DESCRIPTIONS: Record<SupportedLang, string> = {
	en: 'Share memories, photos, and reactions from the YaoYao Furum After Gathering (FAG).',
	vi: 'Chia sẻ kỷ niệm, hình ảnh và cảm xúc tại YaoYao Furum After Gathering (FAG).',
	zh: '分享 YaoYao Furum After Gathering (FAG) 的照片、留言与互动。',
	th: 'แบ่งปันความทรงจำ รูปภาพ และความรู้สึกจาก YaoYao Furum After Gathering (FAG)',
}

export const onRequestGet = async (
	context: PagesContext
): Promise<Response> => {
	const baseResponse = await getBaseHtmlResponse(context)
	const url = new URL(context.request.url)
	const lang = resolveLang(url, context.request.headers.get('accept-language'))
	const title = FEEDBACK_TITLES[lang]
	const description = FEEDBACK_DESCRIPTIONS[lang]

	return rewriteMetaResponse(baseResponse, {
		lang,
		url: url.toString(),
		title,
		description,
		imageUrl: `${url.origin}/images/banner.png`,
	})
}
