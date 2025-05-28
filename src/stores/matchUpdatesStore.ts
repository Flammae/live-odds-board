import { create } from "zustand";
import type { MatchUpdateEvent } from "../types/match";

interface MatchUpdatesState {
	matches: Record<string, MatchUpdateEvent>;
	addMatch: (match: MatchUpdateEvent) => void;
	removeMatch: (matchId: string) => void;
}

export const useMatchUpdatesStore = create<MatchUpdatesState>((set) => ({
	matches: {},
	addMatch: (match) =>
		set((state) => ({
			matches: {
				...state.matches,
				[match.id]: match,
			},
		})),
	removeMatch: (matchId) =>
		set((state) => ({
			matches: Object.fromEntries(
				Object.entries(state.matches).filter(([id]) => id !== matchId)
			),
		})),
}));
