import { apiFetch } from '@/services/api'

export async function dismissEvent(eid: string, falseAlarmDescription?: string) {
    const response = await apiFetch(`/events/${eid}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({ false_alarm: falseAlarmDescription ?? null }),
    });
    if (!response.ok) throw new Error('Failed to dismiss event');
    return response.json();
}