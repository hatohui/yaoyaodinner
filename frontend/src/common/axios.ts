import a, { type AxiosRequestConfig } from 'axios'
import { API_URL } from './app'
import {
	ADMIN_HEADER,
	ADMIN_PASSPHRASE_STORAGE_KEY,
	TABLE_ACCESS_HEADER,
	TABLE_CODE_STORAGE_KEY,
} from './constants'
import { useAdmin } from '@/hooks/useAdmin'
import { localStorage } from '@/utils/localstorage'

const ApiUrl = API_URL

const axios = a.create({
	baseURL: ApiUrl,
	timeout: 30000,
	headers: {
		'Content-Type': 'application/json',
	},
})

axios.interceptors.request.use(config => {
	const passphrase = localStorage.load(ADMIN_PASSPHRASE_STORAGE_KEY)
	if (passphrase) config.headers[ADMIN_HEADER] = passphrase

	// the server checks this table's code on edits; read from storage to avoid
	// an import cycle with the table-code store
	const held = localStorage.load(TABLE_CODE_STORAGE_KEY)
	if (held) {
		try {
			const { tableId, code } = JSON.parse(held) as {
				tableId: string
				code: string
			}
			if (tableId && code)
				config.headers[TABLE_ACCESS_HEADER] = `${tableId}:${code}`
		} catch {
			// a corrupt entry just means no code is sent
		}
	}
	return config
})

axios.interceptors.response.use(
	response => response,
	error => {
		// Only the admin guard answers 401. A rejected passphrase logs out the admin
		// role alone; the guest PIN is checked separately by useGuestSession, so an
		// admin-only request must never cost someone their event access.
		if (
			error.response?.status === 401 &&
			error.config?.headers?.[ADMIN_HEADER] &&
			useAdmin.getState().passphrase
		)
			useAdmin.getState().clear()
		if (!error.response)
			error.message =
				error.code === 'ECONNABORTED' ? 'timeout' : 'network_error'
		const data = error.response?.data?.message
		if (typeof data === 'string') {
			error.message = data
		} else if (Array.isArray(data)) {
			error.message = data.join(', ')
		}
		return Promise.reject(error)
	}
)

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
	axios(config).then(res => res.data)

export default axios
