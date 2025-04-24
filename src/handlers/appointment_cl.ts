import type { SQSEvent } from 'aws-lambda'
import type { AppointmentPayload } from '../types/index.js'
import { env } from 'node:process'
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'
import mysql from 'mysql2/promise'

export async function handler(event: SQSEvent): Promise<void> {
	const connection = await mysql.createConnection(env.DATABASE_URL)
	const busClient = new EventBridgeClient()

	for (const record of event.Records) {
		const item = JSON.parse(record.body) as AppointmentPayload

		await connection.execute(
			'INSERT INTO appointments (insured_id, schedule_id) VALUES (?, ?)',
			[item.insuredId, item.scheduleId],
		)

		await busClient.send(new PutEventsCommand({
			Entries: [
				{
					EventBusName: env.COMPLETED_BUS_NAME,
					Source: env.COMPLETED_BUS_SOURCE,
					DetailType: env.COMPLETED_BUS_DETAIL_TYPE,
					Detail: JSON.stringify(item),
				},
			],
		}))
	}
}
