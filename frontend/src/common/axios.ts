import a from 'axios'
import { API_URL } from './app'

const ApiUrl = import.meta.env.DEV ? 'http://localhost:8080/api' : API_URL

const axios = a.create({
	baseURL: ApiUrl,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
})

axios.interceptors.response.use(
	response => response,
	error => {
		if (error.response?.data?.message) {
			error.message = error.response.data.message
		}
		return Promise.reject(error)
	}
)

export default axios
