import { useQuery } from '@tanstack/react-query'
import axios from '../common/axios'
import type { HealthResponse } from '../types/dtos/health'

export const useHealth = () =>
	useQuery({
		queryKey: ['health'],
		queryFn: () => axios.get<HealthResponse>('/health').then(res => res.data),
		retry: false,
		refetchOnWindowFocus: false,
	})
