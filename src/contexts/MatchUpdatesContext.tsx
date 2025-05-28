import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { MockWebSocket } from "../mock/websocket";
import React from "react";
import type { MatchUpdateEvent, SuspendedEvent } from "../types/match";

type MatchUpdatesContextType = MockWebSocket;

const MatchUpdatesContext = createContext<MatchUpdatesContextType | null>(null);

type MatchUpdatesProviderProps = {
	children: ReactNode;
};

export const MatchUpdatesProvider = React.memo(function MatchUpdatesProvider({
	children,
}: MatchUpdatesProviderProps) {
	const ws = new MockWebSocket();

	return (
		<MatchUpdatesContext.Provider value={ws}>
			{children}
		</MatchUpdatesContext.Provider>
	);
});

export function useMatchUpdates() {
	const ws = useContext(MatchUpdatesContext);
	if (!ws) {
		throw new Error(
			"useMatchUpdates must be used within a MatchUpdatesProvider"
		);
	}
	return ws;
}

interface UseMatchEventsProp {
	onSuspended: (event: SuspendedEvent) => void;
	onUpdated: (event: MatchUpdateEvent) => void;
}

export function useMatchEvents({ onSuspended, onUpdated }: UseMatchEventsProp) {
	const ws = useMatchUpdates();

	React.useEffect(() => {
		const handleMessage = (data: string) => {
			const parsed = JSON.parse(data) as MatchUpdateEvent | SuspendedEvent;
			if (parsed.type === "suspended") {
				onSuspended(parsed);
			} else if (parsed.type === "update") {
				onUpdated(parsed);
			}
		};

		ws.addEventListener("message", handleMessage);
		return () => {
			ws.removeEventListener("message", handleMessage);
		};
	}, [ws, onSuspended, onUpdated]);
}
