export interface ReceiptRow {
	left: string
	sub?: string
	right: string
	muted?: boolean
	bold?: boolean
	highlight?: boolean
}

export interface ReceiptSection {
	rows: ReceiptRow[]
}

export interface ReceiptImageOptions {
	filename: string
	title: string
	sections: ReceiptSection[]
	totalLabel?: string
	totalValue?: string
	footer?: string
}

const WIDTH = 440
const PAD = 24
const SCALE = 2
const FONT =
	'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

function fitText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number
): string {
	if (ctx.measureText(text).width <= maxWidth) return text
	let out = text
	while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
		out = out.slice(0, -1)
	}
	return `${out}…`
}

/**
 * Renders a crisp 2× PNG receipt onto an offscreen canvas and triggers a browser
 * download. Canvas drawing avoids html2canvas issues with Tailwind v4 oklch().
 */
export function downloadReceiptImage({
	filename,
	title,
	sections,
	totalLabel,
	totalValue,
	footer,
}: ReceiptImageOptions) {
	const nonEmpty = sections.filter(s => s.rows.length > 0)
	const hasTotal = Boolean(totalLabel && totalValue)

	let height = PAD + 26 + 14 // top pad + title + gap
	for (const [si, sec] of nonEmpty.entries()) {
		if (si > 0) height += 18 // dashed divider
		for (const row of sec.rows) {
			height += row.sub ? 38 : 24
		}
	}
	if (hasTotal) height += 18 + 30
	if (footer) height += 26
	height += PAD

	const canvas = document.createElement('canvas')
	canvas.width = WIDTH * SCALE
	canvas.height = height * SCALE
	const ctx = canvas.getContext('2d')
	if (!ctx) return
	ctx.scale(SCALE, SCALE)

	// Paper background
	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, 0, WIDTH, height)

	let y = PAD + 14
	ctx.textBaseline = 'alphabetic'

	// Title
	ctx.fillStyle = '#64748b'
	ctx.font = `700 11px ${FONT}`
	ctx.textAlign = 'center'
	ctx.fillText(title.toUpperCase(), WIDTH / 2, y)
	y += 26

	const drawDivider = () => {
		ctx.save()
		ctx.strokeStyle = '#cbd5e1'
		ctx.lineWidth = 1
		ctx.setLineDash([4, 4])
		ctx.beginPath()
		ctx.moveTo(PAD, y)
		ctx.lineTo(WIDTH - PAD, y)
		ctx.stroke()
		ctx.restore()
		y += 18
	}

	const innerW = WIDTH - PAD * 2

	for (const [si, sec] of nonEmpty.entries()) {
		if (si > 0) drawDivider()
		for (const row of sec.rows) {
			ctx.font = `${row.bold || row.highlight ? 700 : 500} 13px ${FONT}`
			const rightW = ctx.measureText(row.right).width
			const maxLeftW = Math.max(80, innerW - rightW - 14)

			ctx.textAlign = 'left'
			ctx.fillStyle = row.highlight
				? '#b45309'
				: row.muted
					? '#64748b'
					: '#0f172a'
			ctx.fillText(fitText(ctx, row.left, maxLeftW), PAD, y)

			ctx.textAlign = 'right'
			ctx.fillText(row.right, WIDTH - PAD, y)

			if (row.sub) {
				y += 15
				ctx.font = `400 11px ${FONT}`
				ctx.textAlign = 'left'
				ctx.fillStyle = '#64748b'
				ctx.fillText(fitText(ctx, row.sub, innerW), PAD, y)
				y += 23
			} else {
				y += 24
			}
		}
	}

	if (hasTotal && totalLabel && totalValue) {
		drawDivider()
		ctx.font = `700 15px ${FONT}`
		ctx.fillStyle = '#0f172a'
		ctx.textAlign = 'left'
		ctx.fillText(totalLabel, PAD, y)
		ctx.textAlign = 'right'
		ctx.fillText(totalValue, WIDTH - PAD, y)
		y += 30
	}

	if (footer) {
		ctx.font = `400 11px ${FONT}`
		ctx.fillStyle = '#64748b'
		ctx.textAlign = 'left'
		ctx.fillText(fitText(ctx, footer, innerW), PAD, y)
	}

	canvas.toBlob(blob => {
		if (!blob) return
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = filename
		a.click()
		setTimeout(() => URL.revokeObjectURL(url), 1_000)
	}, 'image/png')
}
