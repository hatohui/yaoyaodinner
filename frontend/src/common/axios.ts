import a, { type AxiosRequestConfig } from 'axios'
import { API_URL } from './app'
import { ADMIN_HEADER, ADMIN_PASSPHRASE_STORAGE_KEY } from './constants'
import { localStorage } from '@/utils/localstorage'

const ApiUrl = API_URL

const axios = a.create({
	baseURL: ApiUrl,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
})

axios.interceptors.request.use(config => {
	const passphrase = localStorage.load(ADMIN_PASSPHRASE_STORAGE_KEY)
	if (passphrase) config.headers[ADMIN_HEADER] = passphrase
	return config
})

axios.interceptors.response.use(
	response => response,
	error => {
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
