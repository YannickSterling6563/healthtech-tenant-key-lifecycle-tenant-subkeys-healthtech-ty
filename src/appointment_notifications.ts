import { z } from "zod";

export const appointmentSchema = z.object({
  appointmentId: z.string().min(1),
  startsAt: z.string().datetime(),
  clinicName: z.string().min(1),
  patient: z.object({
    preferredName: z.string().min(1),
    safePhone: z.string().min(7).optional(),
    operationalMessagesAllowed: z.boolean()
  })
});

export type Appointment = z.infer<typeof appointmentSchema>;

export type NotificationDecision =
  | { send: false; reason: "NO_CONSENT" | "NO_SAFE_CHANNEL" }
  | { send: true; channel: "sms"; to: string; message: string };

export function planAppointmentReminder(input: Appointment): NotificationDecision {
  if (!input.patient.operationalMessagesAllowed) {
    return { send: false, reason: "NO_CONSENT" };
  }
  if (!input.patient.safePhone) {
    return { send: false, reason: "NO_SAFE_CHANNEL" };
  }

  const startsAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(input.startsAt));

  return {
    send: true,
    channel: "sms",
    to: input.patient.safePhone,
    message: `${input.patient.preferredName}, appointment reminder from ${input.clinicName}: ${startsAt} UTC. Reply to the clinic if you need to reschedule.`
  };
}
