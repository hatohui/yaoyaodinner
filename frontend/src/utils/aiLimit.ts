import { isAxiosError } from 'axios'

/** The server refused because this guest used up their AI allowance for the day. */
export const isAiLimit = (err: unknown) =>
	isAxiosError(err) && err.response?.data?.code === 'ai_daily_limit'
