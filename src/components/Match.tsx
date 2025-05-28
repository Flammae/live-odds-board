import { useMatchUpdates } from "../contexts/MatchUpdatesContext";
import { useMatchUpdatesStore } from "../stores/matchUpdatesStore";
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
	lastUpdated,
}: MatchProps) {
	const { selectedOdds, addSelectedOdds, removeSelectedOdds } =
		useSelectedOddsStore();
	const matchUpdate = useMatchUpdatesStore(
		(state) => state.matches[id] as (typeof state.matches)[string] | undefined
	);

	// Determine if we should use updated data
	const shouldUseMatchUpdate =
		matchUpdate !== undefined && matchUpdate.lastUpdated > lastUpdated;

	// Subscribe to match updates
	const ws = useMatchUpdates();
	React.useEffect(() => {
		ws.send(JSON.stringify({ type: "subscribe", matchId: id }));

		return () => {
			ws.send(JSON.stringify({ type: "unsubscribe", matchId: id }));
		};
	}, [ws, id]);

	// Handle odds selection
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
				<span className={styles.time}>
					{new Date(startTime).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
			</div>

			<div className={styles.teams}>
				<div className={styles.teamNames}>
					<div className={styles.teamName}>{homeTeam.name}</div>
					<div className={styles.teamName}>{awayTeam.name}</div>
				</div>
				<div className={styles.score}>
					<div className={styles.scoreValue}>
						{shouldUseMatchUpdate ? matchUpdate.score.home : score.home}
					</div>
					<div className={styles.scoreValue}>
						{shouldUseMatchUpdate ? matchUpdate.score.away : score.away}
					</div>
				</div>
			</div>

			<div className={styles.markets}>
				{(shouldUseMatchUpdate ? matchUpdate.markets : markets).map(
					(market) => {
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
											<OddsButton
												key={option.id}
												name={option.name}
												odds={option.odds}
												isSelected={isSelected}
												onClick={() =>
													handleOddsClick(market.id, option.id, option.odds)
												}
											/>
										);
									})}
								</div>
							</div>
						);
					}
				)}
			</div>
		</div>
	);
}

type OddsButtonProps = {
	name: string;
	odds: number;
	isSelected: boolean;
	onClick: () => void;
};

function OddsButton({ isSelected, name, odds, onClick }: OddsButtonProps) {
	const prevOdds = React.useRef(odds);
	const buttonRef = React.useRef<HTMLButtonElement>(null);

	React.useEffect(() => {
		if (prevOdds.current !== odds && buttonRef.current) {
			const isIncrease = odds > prevOdds.current;
			const isDecrease = odds < prevOdds.current;

			if (isIncrease || isDecrease) {
				const keyframes = [
					{ backgroundColor: "white" },
					{ backgroundColor: isIncrease ? "lightgreen" : "lightcoral" },
					{ backgroundColor: "white" },
				];

				const options = {
					duration: 1000,
					easing: "ease-in-out",
				};

				buttonRef.current.animate(keyframes, options);
			}

			prevOdds.current = odds;
		}
	}, [odds]);

	return (
		<button
			ref={buttonRef}
			key={odds}
			className={`${styles.option} ${isSelected ? styles.selected : ""}`}
			type="button"
			onClick={onClick}
		>
			{name}
			<span className={styles.odds}>{odds.toFixed(2)}</span>
		</button>
	);
}
