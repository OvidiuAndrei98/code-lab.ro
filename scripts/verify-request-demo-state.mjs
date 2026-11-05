import assert from "node:assert/strict";
import {
  demoRequests,
  demoSlots,
  initialRequestState,
  requestReducer,
  getSlotState,
  getRequestCounts,
} from "../src/lib/request-demo.ts";

const [first, second, third] = demoRequests;
const initial = () => requestReducer(initialRequestState, { type: "reset" });
const dispatch = (state, type, id) => requestReducer(state, { type, id });
const book = (state, requestId, slotId) =>
  dispatch(
    dispatch(
      dispatch(state, "select-request", requestId),
      "select-slot",
      slotId,
    ),
    "schedule",
  );

function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function assertCoherent(state) {
  const assigned = Object.values(state.bookings).filter(Boolean);
  assert.equal(
    new Set(assigned).size,
    assigned.length,
    "A slot cannot be booked twice",
  );
  for (const slotId of assigned) {
    const slot = demoSlots.find((item) => item.id === slotId);
    assert.ok(
      slot && !slot.initiallyOccupied,
      "Only a known free slot may be assigned",
    );
  }
  assert.deepEqual(
    Object.keys(state.bookings).sort(),
    demoRequests.map((r) => r.id).sort(),
  );
  assert.equal(getSlotState(state, "10:00"), "initially-occupied");
  const counts = getRequestCounts(state);
  assert.equal(counts.scheduled, assigned.length);
  assert.equal(counts.pending + counts.scheduled, 3);
  for (const request of demoRequests) {
    const selected = { ...state, selectedId: request.id };
    for (const slot of demoSlots) {
      const availability = getSlotState(selected, slot.id);
      if (slot.initiallyOccupied)
        assert.equal(availability, "initially-occupied");
      else if (state.bookings[request.id] === slot.id)
        assert.equal(availability, "selected-request");
      else if (assigned.includes(slot.id))
        assert.equal(availability, "occupied");
      else assert.equal(availability, "available");
    }
  }
}

let state = freeze(initial());
assert.equal(state.selectedId, first.id);
assert.equal(state.selectedSlotId, null);
assert.deepEqual(getRequestCounts(state), {
  pending: 3,
  scheduled: 0,
  total: 3,
});

for (const action of [
  { type: "schedule" },
  { type: "cancel" },
  { type: "undo" },
  { type: "select-slot", id: "10:00" },
  { type: "select-slot", id: "25:00" },
  { type: "select-request", id: "unknown" },
]) {
  const result = requestReducer(state, action);
  assert.ok(result.error);
  assert.deepEqual(result.bookings, state.bookings);
  assert.equal(result.history.length, 0);
  assertCoherent(result);
}

state = freeze(book(state, first.id, "11:30"));
assert.equal(state.bookings[first.id], "11:30");
assert.equal(getSlotState(state, "11:30"), "selected-request");
assert.equal(state.history.length, 1);
assert.equal(state.selectedSlotId, null);
const duplicate = dispatch(state, "schedule");
assert.ok(duplicate.error);
assert.equal(duplicate.history.length, 1);

state = freeze(dispatch(state, "select-request", second.id));
assert.equal(getSlotState(state, "11:30"), "occupied");
assert.equal(dispatch(state, "select-slot", "11:30").selectedSlotId, null);
assert.equal(state.history.length, 1, "Selection is not a booking action");
state = freeze(book(state, second.id, "14:00"));
state = freeze(book(state, third.id, "15:30"));
assert.deepEqual(getRequestCounts(state), {
  pending: 0,
  scheduled: 3,
  total: 3,
});
assertCoherent(state);

const allBooked = state;
state = freeze(dispatch(state, "cancel"));
assert.equal(state.bookings[third.id], null);
assert.equal(getSlotState(state, "15:30"), "available");
state = freeze(dispatch(state, "undo"));
assert.deepEqual(
  state.bookings,
  allBooked.bookings,
  "Undo cancellation restores reservation and availability",
);
assert.equal(getSlotState(state, "15:30"), "selected-request");
state = freeze(dispatch(state, "undo"));
assert.equal(state.bookings[third.id], null);
assert.equal(getSlotState(state, "15:30"), "available");
state = freeze(dispatch(state, "select-request", first.id));
state = freeze(dispatch(state, "undo"));
assert.equal(
  state.selectedId,
  second.id,
  "Undo returns focus context to the affected request",
);
assert.equal(state.bookings[second.id], null);
assert.equal(state.bookings[first.id], "11:30");
assert.equal(state.selectedSlotId, null);

// A pending choice must be revalidated on commit, not trusted as a reservation.
const stale = {
  ...initial(),
  selectedSlotId: "11:30",
  bookings: { ...initial().bookings, [second.id]: "11:30" },
};
const rejected = dispatch(freeze(stale), "schedule");
assert.ok(rejected.error);
assert.equal(rejected.selectedSlotId, null);
assert.equal(rejected.bookings[first.id], null);
assert.equal(rejected.bookings[second.id], "11:30");

// Repeatable action sequences cover undo after unrelated selection and cancellation.
let seed = 72493;
const random = (max) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % max;
};
const actions = [
  "select-request",
  "select-slot",
  "schedule",
  "cancel",
  "undo",
  "reset",
];
state = initial();
for (let index = 0; index < 2500; index++) {
  const type = actions[random(actions.length)];
  const id =
    type === "select-request"
      ? [...demoRequests.map((r) => r.id), "unknown"][random(4)]
      : [...demoSlots.map((s) => s.id), "unknown"][random(5)];
  const before = JSON.stringify(state);
  const previous = freeze(state);
  state = dispatch(previous, type, id);
  assert.equal(
    JSON.stringify(previous),
    before,
    "Reducer must not mutate snapshots or prior state",
  );
  assertCoherent(state);
  if (type === "reset") assert.deepEqual(state, initialRequestState);
}

assert.deepEqual(dispatch(state, "reset"), initialRequestState);
console.log(
  "Request demo state: scheduling, conflicts, cancellation, undo, reset and 2500 mixed actions passed.",
);
