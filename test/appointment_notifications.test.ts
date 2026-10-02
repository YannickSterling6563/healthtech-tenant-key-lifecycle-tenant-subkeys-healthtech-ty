import assert from "node:assert/strict";
import test from "node:test";
import { planAppointmentReminder } from "../src/appointment_notifications.js";

test("does not expose appointment details without messaging consent", () => {
  const decision = planAppointmentReminder({
    appointmentId: "apt_42",
    startsAt: "2026-10-14T09:00:00.000Z",
    clinicName: "Harbor Family Clinic",
    patient: {
      preferredName: "Sam",
      safePhone: "+1555010134",
      operationalMessagesAllowed: false
    }
  });

  assert.deepEqual(decision, { send: false, reason: "NO_CONSENT" });
});

test("builds an operational reminder for a patient-approved channel", () => {
  const decision = planAppointmentReminder({
    appointmentId: "apt_42",
    startsAt: "2026-10-14T09:00:00.000Z",
    clinicName: "Harbor Family Clinic",
    patient: {
      preferredName: "Sam",
      safePhone: "+1555010134",
      operationalMessagesAllowed: true
    }
  });

  assert.equal(decision.send, true);
  if (decision.send) {
    assert.equal(decision.to, "+1555010134");
    assert.match(decision.message, /appointment reminder/);
  }
});
