import a, { type AxiosRequestConfig } from 'axios'
import { API_URL } from './app'
import {
	ADMIN_HEADER,
	ADMIN_PASSPHRASE_STORAGE_KEY,
	TABLE_ACCESS_HEADER,
	TABLE_CODE_STORAGE_KEY,
} from './constants'
import { useGuest } from '@/hooks/useGuest'
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
		if (error.response?.status === 401 && useGuest.getState().pin)
			useGuest.getState().clear()
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
