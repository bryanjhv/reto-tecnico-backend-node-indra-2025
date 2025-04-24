declare global {
	// eslint-disable-next-line ts/no-namespace
	namespace NodeJS {
		interface ProcessEnv {
			APPOINTMENT_TABLE_NAME: string
			PENDING_TOPIC_ARN: string

			COMPLETED_BUS_NAME: string
			COMPLETED_BUS_SOURCE: string
			COMPLETED_BUS_DETAIL_TYPE: string

			DATABASE_URL: string
		}
	}
}
