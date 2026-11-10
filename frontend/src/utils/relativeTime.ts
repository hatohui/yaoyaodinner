const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['day', 86_400],
	['hour', 3_600],
	['minute', 60],
	['second', 1],
]

export function relativeTime(date: string | Date, locale: string) {
	const seconds = (new Date(date).getTime() - Date.now()) / 1000
	const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
	const [unit, size] =
		UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? UNITS[UNITS.length - 1]
	return format.format(Math.round(seconds / size), unit)
}
