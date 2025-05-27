import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { MockWebSocket } from "../mock/websocketServer";
import React from "react";

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
	const context = useContext(MatchUpdatesContext);
	if (!context) {
		throw new Error(
			"useMatchUpdates must be used within a MatchUpdatesProvider"
		);
	}
	return context;
}
