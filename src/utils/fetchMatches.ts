import type { Match } from "../types/match";
import matchesData from "../data/matches.json" assert { type: "json" };

const matches: Match[] = matchesData as Match[];

type FetchMatchesResult = {
	items: Match[];
	hasNext: boolean;
	hasPrevious: boolean;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchMatches(
	cursor: string | null,
	limit: number,
	includeCursor: boolean
): Promise<FetchMatchesResult> {
	// Add artificial delay
	await delay(500);

	let startIndex: number;
	let endIndex: number;
	let hasNext: boolean;
	let hasPrevious: boolean;

	if (cursor === null) {
		// First load - start from the beginning
		startIndex = 0;
		endIndex = Math.min(Math.abs(limit), matches.length);
		hasNext = endIndex < matches.length;
		hasPrevious = false;
	} else {
		// Find the index of the cursor item
		const cursorIndex = matches.findIndex((match) => match.id === cursor);

		if (cursorIndex === -1) {
			throw new Error(`Match with id ${cursor} not found`);
		}

		if (limit > 0) {
			// Forward pagination
			startIndex = includeCursor ? cursorIndex : cursorIndex + 1;
			endIndex = Math.min(startIndex + limit, matches.length);
			hasNext = endIndex < matches.length;
			hasPrevious = startIndex > 0;
		} else {
			// Backward pagination
			const absLimit = Math.abs(limit);
			endIndex = includeCursor ? cursorIndex + 1 : cursorIndex;
			startIndex = Math.max(0, endIndex - absLimit);
			hasNext = endIndex < matches.length;
			hasPrevious = startIndex > 0;
		}
	}

	const items = matches.slice(startIndex, endIndex);

	return {
		items,
		hasNext,
		hasPrevious,
	};
}
