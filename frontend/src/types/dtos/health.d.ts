export type HealthResponse = {
	services: {
		database: {
			status: 'healthy' | 'unhealthy'
		}
		redis: {
			status: 'healthy' | 'unhealthy'
		}
	}
	status: 'ok' | 'service_unavailable'
}
