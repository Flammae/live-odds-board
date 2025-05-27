import { useMatchUpdates } from "../contexts/MatchUpdatesContext";
import { useSelectedOddsStore } from "../stores/selectedOddsStore";
import type { Sport, Competitor, Score, BettingMarket } from "../types/match";
import styles from "./Match.module.css";
import React from "react";

type MatchProps = {
	id: string;
	sport: Sport;
	homeTeam: Competitor;
	awayTeam: Competitor;
	startTime: string;
	score: Score;
	markets: BettingMarket[];
	lastUpdated: string;
};

export function Match({
	sport,
	homeTeam,
	awayTeam,
	startTime,
	score,
	markets,
	id,
}: MatchProps) {
	const formattedTime = new Date(startTime).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});

	const ws = useMatchUpdates();
	const { selectedOdds, addSelectedOdds, removeSelectedOdds } =
		useSelectedOddsStore();

	React.useEffect(() => {
		// Subscribe to match updates when component mounts
		ws.send(JSON.stringify({ type: "subscribe", matchId: id }));

		// Unsubscribe when component unmounts
		return () => {
			ws.send(JSON.stringify({ type: "unsubscribe", matchId: id }));
		};
	}, [ws, id]);

	const handleOddsClick = (
		marketId: string,
		optionId: string,
		odds: number
	) => {
		const isSelected = selectedOdds.some(
			(o) =>
				o.matchId === id && o.marketId === marketId && o.optionId === optionId
		);

		if (isSelected) {
			removeSelectedOdds(id, marketId, optionId);
		} else {
			addSelectedOdds({ matchId: id, marketId, optionId, odds });
		}
	};

	return (
		<div className={styles.match}>
			<div className={styles.header}>
				<span className={styles.sportIcon}>{sport.icon}</span>
				<span className={styles.time}>{formattedTime}</span>
			</div>

			<div className={styles.teams}>
				<div className={styles.teamNames}>
					<div className={styles.teamName}>{homeTeam.name}</div>
					<div className={styles.teamName}>{awayTeam.name}</div>
				</div>
				<div className={styles.score}>
					<div className={styles.scoreValue}>{score.home}</div>
					<div className={styles.scoreValue}>{score.away}</div>
				</div>
			</div>

			<div className={styles.markets}>
				{markets.map((market) => {
					return (
						<div key={market.id} className={styles.market}>
							<div className={styles.marketName}>{market.name}</div>
							<div className={styles.options}>
								{market.options.map((option) => {
									const isSelected = selectedOdds.some(
										(o) =>
											o.matchId === id &&
											o.marketId === market.id &&
											o.optionId === option.id
									);
									return (
										<button
											key={option.id}
											className={`${styles.option} ${
												isSelected ? styles.selected : ""
											}`}
											type="button"
											onClick={() =>
												handleOddsClick(market.id, option.id, option.odds)
											}
										>
											{option.name}
											<div className={styles.odds}>
												{option.odds.toFixed(2)}
											</div>
										</button>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
