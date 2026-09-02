import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
} from "@react-native-firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToUserHomeLinks, subscribeToHome } from "@/services/homes";
import type { SecuriFiEvent } from "@/types/firestore";

export type ActiveAlert = {
  alertId: string;
  eventType: "intrusion" | "fire" | "gasLeak" | string;
  hid?: string;
  event?: SecuriFiEvent | null;
} | null;

type AlertContextType = {
  activeAlert: ActiveAlert;
  isLoading: boolean;
};

const AlertContext = createContext<AlertContextType>({
  activeAlert: null,
  isLoading: true,
});

export function AlertProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [activeAlert, setActiveAlert] = useState<ActiveAlert>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setActiveAlert(null);
      setIsLoading(false);
      return;
    }

    let unsubLinks: (() => void) | null = null;
    let unsubHome: (() => void) | null = null;
    let unsubEvent: (() => void) | null = null;
    let unsubOngoingEvents: (() => void) | null = null;

    // 1. Subscribe to user <-> home links to get current home ID
    unsubLinks = subscribeToUserHomeLinks(user.uid, (links) => {
      const hid = links[0]?.hid ?? null;

      if (unsubHome) {
        unsubHome();
        unsubHome = null;
      }
      if (unsubEvent) {
        unsubEvent();
        unsubEvent = null;
      }
      if (unsubOngoingEvents) {
        unsubOngoingEvents();
        unsubOngoingEvents = null;
      }

      if (!hid) {
        setActiveAlert(null);
        setIsLoading(false);
        return;
      }

      // 2. Subscribe to home document to watch activeEventId
      unsubHome = subscribeToHome(hid, (homeData) => {
        const activeEventId = homeData?.activeEventId;

        // Clean up previous event doc listener if activeEventId changed
        if (unsubEvent) {
          unsubEvent();
          unsubEvent = null;
        }
        if (unsubOngoingEvents) {
          unsubOngoingEvents();
          unsubOngoingEvents = null;
        }

        if (!activeEventId) {
          // Older homes (and homes created outside the alert flow) may not
          // maintain activeEventId. Event documents are the source of truth:
          // an event without endedAt is still ongoing.
          const eventsRef = collection(
            getFirestore(),
            "home_events",
            hid,
            "events"
          );
          unsubOngoingEvents = onSnapshot(
            eventsRef,
            (eventsSnap) => {
              const ongoingEvents = eventsSnap.docs
                .map((eventDoc) => ({
                  eid: eventDoc.id,
                  ...eventDoc.data(),
                }) as SecuriFiEvent)
                .filter((event) => !event.endedAt && !event.dismissedByUser)
                .sort((a, b) => b.startedAt.toMillis() - a.startedAt.toMillis());

              const event = ongoingEvents[0];
              setActiveAlert(
                event
                  ? {
                      alertId: event.eid,
                      eventType: event.eventType,
                      hid,
                      event,
                    }
                  : null
              );
              setIsLoading(false);
            },
            (error) => {
              console.error("[AlertContext] Error listening to ongoing events:", error);
              setActiveAlert(null);
              setIsLoading(false);
            }
          );
          return;
        }

        // 3. Subscribe directly to the single active event document
        const eventDocRef = doc(
          getFirestore(),
          "home_events",
          hid,
          "events",
          activeEventId
        );
        unsubEvent = onSnapshot(
          eventDocRef,
          (eventSnap) => {
            if (!eventSnap.exists()) {
              setActiveAlert({
                alertId: activeEventId,
                eventType: "intrusion",
                hid,
              });
              setIsLoading(false);
              return;
            }

            const eventData = eventSnap.data() as any;

            if (eventData?.dismissedByUser || eventData?.endedAt) {
              setActiveAlert(null);
            } else {
              setActiveAlert({
                alertId: activeEventId,
                eventType: eventData?.eventType ?? "intrusion",
                hid,
                event: { eid: eventSnap.id, ...eventData } as SecuriFiEvent,
              });
            }
            setIsLoading(false);
          },
          (error) => {
            console.error("[AlertContext] Error listening to active event doc:", error);
            setActiveAlert({
              alertId: activeEventId,
              eventType: "intrusion",
              hid,
            });
            setIsLoading(false);
          }
        );
      });
    });

    return () => {
      if (unsubLinks) unsubLinks();
      if (unsubHome) unsubHome();
      if (unsubEvent) unsubEvent();
      if (unsubOngoingEvents) unsubOngoingEvents();
    };
  }, [user, authLoading]);

  return (
    <AlertContext.Provider value={{ activeAlert, isLoading }}>
      {children}
    </AlertContext.Provider>
  );
}

export const useActiveAlert = () => useContext(AlertContext);
