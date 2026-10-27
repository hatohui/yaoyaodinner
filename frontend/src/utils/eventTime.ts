/** Shows an instant in the event's own zone so every guest sees the same time. */
export function formatEventTime(iso: string, timeZone: string, lang: string) {
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
