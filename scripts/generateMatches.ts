import type {
	Match,
	Sport,
	Competitor,
	BettingMarket,
} from "../src/types/match";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const __dirname = new URL(".", import.meta.url).pathname;

const SPORTS: Sport[] = [
	{ id: "soccer", name: "Soccer", icon: "⚽" },
	{ id: "basketball", name: "Basketball", icon: "🏀" },
	{ id: "tennis", name: "Tennis", icon: "🎾" },
	{ id: "volleyball", name: "Volleyball", icon: "🏐" },
	{ id: "hockey", name: "Hockey", icon: "🏒" },
];

const TEAM_NAMES = [
	"United",
	"City",
	"Rovers",
	"Athletic",
	"Rangers",
	"Wanderers",
	"Dynamo",
	"Phoenix",
	"Eagles",
	"Lions",
	"Tigers",
	"Bears",
	"Wolves",
	"Dragons",
	"Knights",
	"Royals",
	"Kings",
	"Queens",
	"Princes",
	"Warriors",
];

const CITIES = [
	"London",
	"Manchester",
	"Liverpool",
	"Birmingham",
	"Leeds",
	"Glasgow",
	"Edinburgh",
	"Cardiff",
	"Bristol",
	"Newcastle",
	"Paris",
	"Berlin",
	"Madrid",
	"Rome",
	"Amsterdam",
	"Moscow",
	"Istanbul",
	"Dubai",
	"Tokyo",
	"Sydney",
];

const MARKET_TYPES = [
	{ id: "1x2", name: "1X2", options: ["1", "X", "2"] },
	{ id: "double_chance", name: "Double Chance", options: ["1X", "12", "X2"] },
	{ id: "total", name: "Total", options: ["Over 2.5", "Under 2.5"] },
];

function generateTeamName(): string {
	const city = CITIES[Math.floor(Math.random() * CITIES.length)];
	const team = TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)];
	return `${city} ${team}`;
}

function generateCompetitor(): Competitor {
	return {
		id: Math.random().toString(36).substring(2, 15),
		name: generateTeamName(),
	};
}

function generateBettingMarket(
	marketType: (typeof MARKET_TYPES)[0]
): BettingMarket {
	return {
		id: marketType.id,
		name: marketType.name,
		options: marketType.options.map((option) => ({
			id: `${marketType.id}_${option}`,
			name: option,
			odds: Number((Math.random() * 3 + 1).toFixed(2)),
		})),
	};
}

function generateMatch(startTime: Date): Match {
	const sport = SPORTS[Math.floor(Math.random() * SPORTS.length)];

	return {
		id: Math.random().toString(36).substring(2, 15),
		sport,
		competitors: {
			home: generateCompetitor(),
			away: generateCompetitor(),
		},
		startTime: startTime.toISOString(),
		score: {
			home: Math.floor(Math.random() * 5),
			away: Math.floor(Math.random() * 5),
		},
		markets: MARKET_TYPES.map((marketType) =>
			generateBettingMarket(marketType)
		),
		lastUpdated: new Date().toISOString(),
	};
}

function generateMatches(count: number): Match[] {
	const matches: Match[] = [];
	const now = new Date();
	const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

	// Generate matches with increasing timestamps
	for (let i = 0; i < count; i++) {
		// Add random minutes to the start time
		const minutesToAdd = Math.floor(i / 100); // Every 100 matches, add a minute
		const randomMinutes = Math.floor(Math.random() * 5); // Add 0-4 random minutes
		const startTime = new Date(
			oneHourAgo.getTime() + (minutesToAdd + randomMinutes) * 60 * 1000
		);

		matches.push(generateMatch(startTime));
	}

	// Sort matches by startTime
	return matches.sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
	);
}

// Generate 10,000 matches
const matches = generateMatches(10000);

// Ensure the output directory exists
const outputDir = join(__dirname, "..", "src", "data");
if (!existsSync(outputDir)) {
	mkdirSync(outputDir, { recursive: true });
}

// Write the matches to a JSON file
writeFileSync(
	join(outputDir, "matches.json"),
	JSON.stringify(matches, null, 2)
);

console.log(
	`Generated ${matches.length} matches and saved to ${join(
		outputDir,
		"matches.json"
	)}`
);
