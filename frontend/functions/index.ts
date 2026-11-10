import {
	getApiBase,
	getBaseHtmlResponse,
	resolveLang,
	rewriteMetaResponse,
	type PagesContext,
	type SupportedLang,
} from './_shared'

interface OrderingStatusDto {
	timezone: string
	deadline: string | null
	dinnerTime: string | null
}

const EVENT_TITLE = 'Furum After Gathering'
const VENUE = '高人馆 · Gao Ren Guan, Subang Jaya'

const LANDING_COPY: Record<
	SupportedLang,
	{ subtitle: string; dinnerLabel: string; orderByLabel: string }
> = {
	en: {
		subtitle: 'A private post-Furum gathering hosted by Yao Yao',
		dinnerLabel: 'Dinner time',
		orderByLabel: 'Order by',
	},
	vi: {
		subtitle: 'Buổi tụ họp riêng hậu sự kiện Furum do Yao Yao tổ chức',
		dinnerLabel: 'Giờ ăn tối',
		orderByLabel: 'Đặt món trước',
	},
	zh: {
		subtitle: '由 Yao Yao 主办的 Furum 赛后私人聚会',
		dinnerLabel: '晚餐时间',
		orderByLabel: '预订截止',
	},
	th: {
		subtitle: 'งานรวมตัวสังสรรค์ส่วนตัวหลังงาน Furum จัดโดย Yao Yao',
		dinnerLabel: 'เวลามื้อค่ำ',
		orderByLabel: 'สั่งได้ถึง',
	},
}

function formatTime(iso: string | null, timeZone: string, lang: string) {
	if (!iso) return ''
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return ''
	const options: Intl.DateTimeFormatOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short',
	}
	try {
		return new Intl.DateTimeFormat(lang, { ...options, timeZone }).format(date)
	} catch {
		return new Intl.DateTimeFormat(lang, options).format(date)
	}
}

export const onRequestGet = async (
	context: PagesContext
): Promise<Response> => {
	const baseResponse = await getBaseHtmlResponse(context)
	const url = new URL(context.request.url)
	const lang = resolveLang(url, context.request.headers.get('accept-language'))
	const copy = LANDING_COPY[lang]
	const apiBase = getApiBase(context.env)

	const parts = [copy.subtitle, VENUE]

	try {
		const apiRes = await fetch(`${apiBase}/api/ordering`, {
			headers: { Accept: 'application/json' },
		})
		if (apiRes.ok) {
			const status = (await apiRes.json()) as OrderingStatusDto
			const tz = status.timezone || 'Asia/Kuala_Lumpur'
			const dinnerFormatted = formatTime(status.dinnerTime, tz, lang)
			const deadlineFormatted = formatTime(status.deadline, tz, lang)
			if (dinnerFormatted) {
				parts.push(`${copy.dinnerLabel}: ${dinnerFormatted}`)
			}
			if (deadlineFormatted) {
				parts.push(`${copy.orderByLabel}: ${deadlineFormatted}`)
			}
		}
	} catch {
		// Fall back to static subtitle + venue if ordering endpoint is unreachable
	}

	return rewriteMetaResponse(baseResponse, {
		lang,
		url: url.toString(),
		title: EVENT_TITLE,
		pageTitle: EVENT_TITLE,
		description: parts.join(' · '),
		imageUrl: `${url.origin}/images/banner.png`,
	})
}
