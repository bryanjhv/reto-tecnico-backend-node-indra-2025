export interface AppointmentPayload {
	insuredId: string
	scheduleId: number
	countryISO: 'PE' | 'CL'
}

export interface AppointmentRecord extends AppointmentPayload {
	status: 'pending' | 'completed'
}
