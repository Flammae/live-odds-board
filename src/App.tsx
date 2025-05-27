import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BidirectionalInfiniteList } from "./components/BidirectionalInfiniteList";
import { fetchMatches } from "./utils/fetchMatches";
import { Match } from "./components/Match";
import styles from "./components/FetchButton.module.css";
import { useEffect } from "react";
import { useMatchUpdates } from "./contexts/MatchUpdatesContext";
import { useSelectedOddsStore } from "./stores/selectedOddsStore";
import { FloatingHomeButton } from "./components/FloatingHomeButton";

type PageParam = {
	cursor: string | null;
	limit: number;
	isInitialFetch?: boolean;
};

function getInitialCursor(): string | null {
	const hash = window.location.hash;
	if (!hash) return null;

	// Remove the # and return the full hash value
	return hash.slice(1);
}

export default function App() {
	const listRef = React.useRef<HTMLDivElement>(null);
	const initialCursor = React.useMemo(() => getInitialCursor(), []);
	const [hasAttemptedPreviousFetch, setHasAttemptedPreviousFetch] =
		React.useState(false);
	const removeSelectedOdds = useSelectedOddsStore(
		(state) => state.removeSelectedOdds
	);

	const {
		status,
		data,
		error,
		isFetchingNextPage,
		isFetchingPreviousPage,
		fetchNextPage,
		fetchPreviousPage,
		hasNextPage,
		hasPreviousPage,
	} = useInfiniteQuery({
		queryKey: ["matches"],
		maxPages: 3,
		initialPageParam: {
			cursor: initialCursor,
			limit: 40,
			isInitialFetch: true,
		} as PageParam,
		queryFn: async ({ pageParam }) => {
			const { cursor, limit, isInitialFetch } = pageParam as PageParam;
			console.log("isInitialFetch", isInitialFetch, cursor, limit);
			const result = await fetchMatches(cursor, limit, isInitialFetch ?? false);
			return result;
		},
		getNextPageParam: (lastPage) => {
			if (!lastPage.hasNext) return undefined;
			const lastItem = lastPage.items[lastPage.items.length - 1];
			return {
				cursor: lastItem.id,
				limit: 40,
				isInitialFetch: false,
			} as PageParam;
		},
		getPreviousPageParam: (firstPage) => {
			if (!firstPage.hasPrevious) return undefined;
			const firstItem = firstPage.items[0];
			return {
				cursor: firstItem.id,
				limit: -40,
				isInitialFetch: false,
			} as PageParam;
		},
	});

	const rows = React.useMemo(() => {
		return data?.pages.flatMap((page) => page.items) ?? [];
	}, [data]);

	const handlePreviousFetch = React.useCallback(() => {
		setHasAttemptedPreviousFetch(true);
		fetchPreviousPage();
	}, [fetchPreviousPage]);

	const handleNextFetch = React.useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			fetchNextPage();
		},
		[fetchNextPage]
	);

	const ws = useMatchUpdates();

	useEffect(() => {
		const handleMessage = (data: string) => {
			const parsed = JSON.parse(data);
			if (parsed.type === "suspended") {
				// Remove the match from selected odds when it's suspended
				removeSelectedOdds(parsed.matchId);
			}
		};

		ws.addEventListener("message", handleMessage);
		return () => {
			ws.removeEventListener("message", handleMessage);
		};
	}, [ws, removeSelectedOdds]);

	const canFetchPrevious =
		!isFetchingPreviousPage &&
		hasPreviousPage &&
		(hasAttemptedPreviousFetch || (data?.pages.length ?? 0) > 1);
	const canFetchNext = !isFetchingNextPage && hasNextPage;

	return (
		<main style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
			<h1 style={{ margin: "12px 0 24px" }}>Betting Odds</h1>

			{hasPreviousPage && (
				<button onClick={handlePreviousFetch} className={styles.button}>
					Fetch Previous Page
				</button>
			)}

			{status === "pending" ? (
				<div>Loading...</div>
			) : status === "error" && error instanceof Error ? (
				<div>Error: {error.message}</div>
			) : (
				<div ref={listRef}>
					<BidirectionalInfiniteList
						rows={rows}
						rowHeight={250}
						renderItem={(item) => (
							<Match
								id={item.id}
								sport={item.sport}
								homeTeam={item.competitors.home}
								awayTeam={item.competitors.away}
								startTime={item.startTime}
								score={item.score}
								markets={item.markets}
								lastUpdated={item.lastUpdated}
							/>
						)}
						edgeReachedThreshold={20}
						onStartReached={() => {
							console.log("onStartReached");
							return fetchPreviousPage();
						}}
						canFetchPrevious={canFetchPrevious}
						onEndReached={() => {
							console.log("onEndReached");
							return fetchNextPage();
						}}
						canFetchNext={canFetchNext}
						scrollMargin={listRef.current?.offsetTop ?? 0}
						onChange={(virtualItems, sync) => {
							if (virtualItems.length === 0) {
								return;
							}

							if (!sync) {
								history.replaceState(null, "", `#${virtualItems[0].id}`);
							}
						}}
					/>
				</div>
			)}
			{hasNextPage && (
				<a
					href={`/#${rows[rows.length - 1].id}`}
					onClick={handleNextFetch}
					className={styles.link}
				>
					Fetch Next Page
				</a>
			)}

			<FloatingHomeButton />
		</main>
	);
}
