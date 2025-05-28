export type Sport = {
	id: string;
	name: string;
	icon: string;
};

export type Competitor = {
	id: string;
	name: string;
};

export type Score = {
	home: number;
	away: number;
};

export type BettingOption = {
	id: string;
	name: string;
	odds: number;
};

export type BettingMarket = {
	id: string;
	name: string;
	options: BettingOption[];
};

export type Match = {
	id: string;
	sport: Sport;
	competitors: {
		home: Competitor;
		away: Competitor;
	};
	startTime: string;
	score: Score;
	markets: BettingMarket[];
	lastUpdated: string;
};

export type MatchUpdateEvent = {
	type: "update";
	id: string;
	score: {
		home: number;
		away: number;
	};
	markets: {
		id: string;
		name: string;
		options: {
			id: string;
			name: string;
			odds: number;
		}[];
	}[];
	lastUpdated: string;
};

export type SuspendedEvent = {
	type: "suspended";
	matchId: string;
};
