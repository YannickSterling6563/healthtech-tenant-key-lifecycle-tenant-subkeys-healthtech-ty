import { appointmentSchema, planAppointmentReminder } from "./appointment_notifications.js";

const appointment = appointmentSchema.parse({
  appointmentId: "apt_2026_10_14_0900",
  startsAt: "2026-10-14T09:00:00.000Z",
  clinicName: "Harbor Family Clinic",
  patient: {
    preferredName: "Sam",
    safePhone: "+1555010134",
    operationalMessagesAllowed: true
  }
});

console.log(planAppointmentReminder(appointment));
