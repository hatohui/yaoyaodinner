import a from 'axios'

const ApiUrl = import.meta.env.DEV
	? 'http://localhost:8080/api'
	: 'https://api.yaoyaodinner.party/api'

const axios = a.create({
	baseURL: ApiUrl,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
})

export default axios
