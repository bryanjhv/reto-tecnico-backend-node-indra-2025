import type { APIGatewayProxyHandlerV2, EventBridgeEvent, SQSHandler } from 'aws-lambda'
import type { AppointmentPayload, AppointmentRecord } from '../types/index.js'
import { env } from 'node:process'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

type HandlerKind = APIGatewayProxyHandlerV2 | SQSHandler
type HandlerRequest = Parameters<HandlerKind>[0]
type HandlerResponse = Awaited<ReturnType<HandlerKind>>

export async function handler(event: HandlerRequest): Promise<HandlerResponse> {
	const ddbClient = new DynamoDBClient()
	const docClient = DynamoDBDocumentClient.from(ddbClient)
	const snsClient = new SNSClient()

	if ('Records' in event) {
		for (const record of event.Records) {
			const { detail } = JSON.parse(record.body) as EventBridgeEvent<'', AppointmentPayload>

			await docClient.send(new UpdateCommand({
				TableName: env.APPOINTMENT_TABLE_NAME,
				Key: {
					insuredId: detail.insuredId,
					scheduleId: detail.scheduleId,
				},
				UpdateExpression: 'SET #status = :status',
				ExpressionAttributeNames: { '#status': 'status' },
				ExpressionAttributeValues: { ':status': 'completed' },
			}))
		}
	}

	else if (event.requestContext.http.method === 'POST') {
		const data = JSON.parse(event.body!) as AppointmentPayload
		const item = { ...data, status: 'pending' } as AppointmentRecord

		await docClient.send(new PutCommand({
			TableName: env.APPOINTMENT_TABLE_NAME,
			Item: item,
		}))

		await snsClient.send(new PublishCommand({
			TopicArn: env.PENDING_TOPIC_ARN,
			Message: JSON.stringify(data), // no extra fields
		}))

		return {
			statusCode: 202,
			body: JSON.stringify(item),
			headers: { 'Content-Type': 'application/json' },
		}
	}

	else {
		const insuredId = event.pathParameters!['insuredId']!

		const { Items } = await docClient.send(new ScanCommand({
			TableName: env.APPOINTMENT_TABLE_NAME,
			FilterExpression: 'insuredId = :insuredId',
			ExpressionAttributeValues: {
				':insuredId': insuredId,
			},
		}))

		return {
			statusCode: 200,
			body: JSON.stringify(Items),
			headers: { 'Content-Type': 'application/json' },
		}
	}
}
