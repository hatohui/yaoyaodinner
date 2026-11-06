const RELOAD_FLAG = 'chunk_reload_at'
// a second failure inside this window means the reload didn't help
const RELOAD_WINDOW_MS = 30_000

const CHUNK_ERROR =
	/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i

export const isChunkLoadError = (error: unknown) =>
	error instanceof Error && CHUNK_ERROR.test(error.message)

const readFlag = () => {
	try {
		return Number(sessionStorage.getItem(RELOAD_FLAG)) || 0
	} catch {
		return 0
	}
}

/**
 * Reloads once to pick up a new deploy, whose chunk names replace the ones this
 * tab still references. Returns false if a reload was already tried recently.
 */
export function reloadForNewDeploy() {
	if (Date.now() - readFlag() < RELOAD_WINDOW_MS) return false
	try {
		sessionStorage.setItem(RELOAD_FLAG, String(Date.now()))
	} catch {
		return false
	}
	window.location.reload()
	return true
}
