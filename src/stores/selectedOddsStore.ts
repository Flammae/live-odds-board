import { create } from "zustand";
import { persist } from "zustand/middleware";

type SelectedOdds = {
	matchId: string;
	marketId: string;
	optionId: string;
	odds: number;
	timestamp: number;
};

type SelectedOddsStore = {
	selectedOdds: SelectedOdds[];
	addSelectedOdds: (odds: Omit<SelectedOdds, "timestamp">) => void;
	removeSelectedOdds: (
		matchId: string,
		marketId?: string,
		optionId?: string
	) => void;
	clearExpiredOdds: () => void;
};

const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useSelectedOddsStore = create<SelectedOddsStore>()(
	persist(
		(set) => ({
			selectedOdds: [],

			addSelectedOdds: (odds) => {
				const timestamp = Date.now();
				set((state) => ({
					selectedOdds: [
						...state.selectedOdds.filter(
							(o) =>
								!(
									o.matchId === odds.matchId &&
									o.marketId === odds.marketId &&
									o.optionId === odds.optionId
								)
						),
						{ ...odds, timestamp },
					],
				}));
			},

			removeSelectedOdds: (matchId, marketId, optionId) => {
				set((state) => ({
					selectedOdds: state.selectedOdds.filter(
						(o) =>
							!(
								o.matchId === matchId &&
								(!marketId || o.marketId === marketId) &&
								(!optionId || o.optionId === optionId)
							)
					),
				}));
			},

			clearExpiredOdds: () => {
				const now = Date.now();
				set((state) => ({
					selectedOdds: state.selectedOdds.filter(
						(odds) => now - odds.timestamp < THIRTY_MINUTES
					),
				}));
			},
		}),
		{
			name: "selected-odds-storage",
			partialize: (state) => ({ selectedOdds: state.selectedOdds }),
			onRehydrateStorage: () => (state) => {
				if (state) {
					const now = Date.now();
					state.selectedOdds = state.selectedOdds.filter(
						(odds) => now - odds.timestamp < THIRTY_MINUTES
					);
				}
			},
		}
	)
);
