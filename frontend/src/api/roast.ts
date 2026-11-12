import { customInstance } from '@/common/axios'

export const clearAllRoasts = () =>
	customInstance<{ ok: boolean }>({ url: '/api/tables/roasts', method: 'DELETE' })

export const clearTableRoast = (tableId: string) =>
	customInstance<{ ok: boolean }>({ url: `/api/tables/${tableId}/roast`, method: 'DELETE' })
