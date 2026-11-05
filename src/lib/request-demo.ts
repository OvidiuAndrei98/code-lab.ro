/** A local, deliberately small workflow. No appointments leave this demo. */
export const demoRequests = [
  {
    id: "discutie",
    title: "Discuție inițială",
    description: "Clarificăm ce trebuie organizat și care este următorul pas.",
    category: "Discuție",
    duration: "30 min",
  },
  {
    id: "prezentare",
    title: "Prezentare de proiect",
    description: "Parcurgem o propunere și notăm ce trebuie ajustat.",
    category: "Prezentare",
    duration: "30 min",
  },
  {
    id: "revizuire",
    title: "Revizuire de conținut",
    description:
      "Verificăm textele și materialele înainte de următoarea etapă.",
    category: "Revizuire",
    duration: "30 min",
  },
] as const;

export const demoSlots = [
  { id: "10:00", label: "10:00", initiallyOccupied: true },
  { id: "11:30", label: "11:30", initiallyOccupied: false },
  { id: "14:00", label: "14:00", initiallyOccupied: false },
  { id: "15:30", label: "15:30", initiallyOccupied: false },
] as const;

export type RequestBookings = Record<string, string | null>;

export type RequestSnapshot = {
  bookings: RequestBookings;
  selectedId: string;
};

export type RequestState = {
  selectedId: string;
  selectedSlotId: string | null;
  bookings: RequestBookings;
  history: RequestSnapshot[];
  message: string;
  error: string | null;
};

export type RequestAction =
  | { type: "select-request"; id: string }
  | { type: "select-slot"; id: string }
  | { type: "schedule" }
  | { type: "cancel" }
  | { type: "undo" }
  | { type: "reset" };

export type DemoSlotState =
  "initially-occupied" | "selected-request" | "occupied" | "available";

const firstRequest = demoRequests[0];

const createInitialState = (): RequestState => ({
  selectedId: firstRequest.id,
  selectedSlotId: null,
  bookings: Object.fromEntries(
    demoRequests.map((request) => [request.id, null]),
  ),
  history: [],
  message: "Selectează o solicitare, apoi un interval disponibil.",
  error: null,
});

export const initialRequestState = createInitialState();

export function getRequestCounts(state: RequestState) {
  const scheduled = demoRequests.filter(
    (request) => state.bookings[request.id] != null,
  ).length;
  return {
    pending: demoRequests.length - scheduled,
    scheduled,
    total: demoRequests.length,
  };
}

/** Occupancy is derived from the same bookings that drive the request rows. */
export function getSlotState(
  state: RequestState,
  slotId: string,
): DemoSlotState {
  const slot = demoSlots.find((item) => item.id === slotId);
  // Unknown slots are unavailable, including if an old event arrives late.
  if (!slot) return "occupied";
  if (slot.initiallyOccupied) return "initially-occupied";
  if (state.bookings[state.selectedId] === slotId) return "selected-request";
  if (Object.values(state.bookings).includes(slotId)) return "occupied";
  return "available";
}

function reject(state: RequestState, error: string): RequestState {
  return { ...state, error };
}

function snapshot(state: RequestState): RequestSnapshot {
  return {
    bookings: { ...state.bookings },
    selectedId: state.selectedId,
  };
}

export function requestReducer(
  state: RequestState,
  action: RequestAction,
): RequestState {
  switch (action.type) {
    case "select-request": {
      const request = demoRequests.find((item) => item.id === action.id);
      if (!request) return reject(state, "Alege o solicitare din listă.");
      const booking = state.bookings[request.id];
      return {
        ...state,
        selectedId: request.id,
        selectedSlotId: null,
        error: null,
        message: booking
          ? `${request.title} este programată la ${booking}. Poți anula programarea.`
          : `${request.title}: alege un interval disponibil.`,
      };
    }
    case "select-slot": {
      if (state.bookings[state.selectedId]) {
        return reject(
          state,
          "Solicitarea este deja programată. Anulează programarea pentru a alege alt interval.",
        );
      }
      const slot = demoSlots.find((item) => item.id === action.id);
      if (!slot) return reject(state, "Alege unul dintre intervalele afișate.");
      if (getSlotState(state, slot.id) !== "available") {
        return reject(
          state,
          "Acest interval este ocupat. Alege unul disponibil.",
        );
      }
      return {
        ...state,
        selectedSlotId: slot.id,
        error: null,
        message: `Ai ales ${slot.label}. Confirmă pentru a programa solicitarea.`,
      };
    }
    case "schedule": {
      const request = demoRequests.find((item) => item.id === state.selectedId);
      if (!request) return reject(state, "Selectează mai întâi o solicitare.");
      if (state.bookings[request.id]) {
        return reject(state, "Această solicitare este deja programată.");
      }
      if (!state.selectedSlotId) {
        return reject(
          state,
          "Alege un interval disponibil înainte de confirmare.",
        );
      }
      // Recheck on commit; a selected slot is not a reservation.
      const slot = demoSlots.find((item) => item.id === state.selectedSlotId);
      if (!slot || getSlotState(state, slot.id) !== "available") {
        return {
          ...state,
          selectedSlotId: null,
          error: "Intervalul nu mai este disponibil. Alege un alt interval.",
        };
      }
      return {
        ...state,
        bookings: { ...state.bookings, [request.id]: slot.id },
        selectedSlotId: null,
        history: [...state.history, snapshot(state)],
        message: `${request.title} a fost programată la ${slot.label}. Intervalul nu mai este disponibil pentru celelalte solicitări.`,
        error: null,
      };
    }
    case "cancel": {
      const request = demoRequests.find((item) => item.id === state.selectedId);
      const slotId = request && state.bookings[request.id];
      if (!request || !slotId) {
        return reject(
          state,
          "Selectează o solicitare programată pentru a o anula.",
        );
      }
      return {
        ...state,
        bookings: { ...state.bookings, [request.id]: null },
        selectedSlotId: null,
        history: [...state.history, snapshot(state)],
        message: `Programarea pentru ${request.title} a fost anulată. Intervalul ${slotId} este din nou disponibil.`,
        error: null,
      };
    }
    case "undo": {
      const previous = state.history.at(-1);
      if (!previous) return reject(state, "Nu există o acțiune de anulat.");
      const request = demoRequests.find(
        (item) => item.id === previous.selectedId,
      )!;
      const slot = previous.bookings[previous.selectedId];
      return {
        ...state,
        selectedId: previous.selectedId,
        selectedSlotId: null,
        bookings: { ...previous.bookings },
        history: state.history.slice(0, -1),
        message: slot
          ? `Ultima acțiune a fost anulată. ${request.title} este din nou programată la ${slot}.`
          : `Ultima acțiune a fost anulată. ${request.title} revine la „De programat”, iar intervalul este din nou disponibil.`,
        error: null,
      };
    }
    case "reset":
      return createInitialState();
    default:
      return state;
  }
}
