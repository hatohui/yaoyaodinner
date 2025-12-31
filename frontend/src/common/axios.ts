import a from 'axios'

const ApiUrl = 'https://api.yaoyaodinner.party/'

const axios = a.create({
	baseURL: ApiUrl,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
})

export default axios
