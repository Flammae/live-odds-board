import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BidirectionalInfiniteList } from "./components/BidirectionalInfiniteList";
import { fetchMatches } from "./utils/fetchMatches";
import { Match } from "./components/Match";
import styles from "./components/FetchButton.module.css";
import { useMatchEvents } from "./contexts/MatchUpdatesContext";
import { FloatingHomeButton } from "./components/FloatingHomeButton";
import { useSelectedOddsStore } from "./stores/selectedOddsStore";
import { useMatchUpdatesStore } from "./stores/matchUpdatesStore";

type PageParam = {
	cursor: string | null;
	limit: number;
	isInitialFetch?: boolean;
};

const LIMIT = 40;

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

	const {
		data,
		error,
		isPending,
		isError,
		isFetchingNextPage,
		isFetchingPreviousPage,
		fetchNextPage,
		fetchPreviousPage,
		hasNextPage,
		hasPreviousPage,
	} = useInfiniteQuery({
		queryKey: ["matches"],
		maxPages: 3,
		retry: 3,
		retryDelay: 400,
		initialPageParam: {
			cursor: initialCursor,
			limit: LIMIT,
			isInitialFetch: true,
		} as PageParam,
		queryFn: async ({ pageParam }) => {
			const { cursor, limit, isInitialFetch } = pageParam as PageParam;
			const result = await fetchMatches(cursor, limit, isInitialFetch ?? false);
			return result;
		},
		getNextPageParam: (lastPage) => {
			if (!lastPage.hasNext) return undefined;
			const lastItem = lastPage.items[lastPage.items.length - 1];
			return {
				cursor: lastItem.id,
				limit: LIMIT,
				isInitialFetch: false,
			} as PageParam;
		},
		getPreviousPageParam: (firstPage) => {
			if (!firstPage.hasPrevious) return undefined;
			const firstItem = firstPage.items[0];
			return {
				cursor: firstItem.id,
				limit: -LIMIT,
				isInitialFetch: false,
			} as PageParam;
		},
	});

	const rows = React.useMemo(() => {
		return data?.pages.flatMap((page) => page.items) ?? [];
	}, [data]);

	const handlePreviousFetch = () => {
		setHasAttemptedPreviousFetch(true);
		fetchPreviousPage();
	};

	const handleNextFetch = (e: React.MouseEvent) => {
		e.preventDefault();
		fetchNextPage();
	};

	// Sockets
	const removeSelectedOdds = useSelectedOddsStore(
		(state) => state.removeSelectedOdds
	);
	const addMatch = useMatchUpdatesStore((state) => state.addMatch);
	useMatchEvents({
		onSuspended: (event) => {
			removeSelectedOdds(event.matchId);
		},
		onUpdated: (event) => {
			addMatch(event);
		},
	});

	return (
		<main style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
			<h1 style={{ margin: "12px 0 24px" }}>Betting Odds</h1>

			{hasPreviousPage && (
				<button onClick={handlePreviousFetch} className={styles.button}>
					Fetch Previous Page
				</button>
			)}

			{isPending ? (
				<div>Loading...</div>
			) : isError ? (
				<div>
					Error: {error.message}
					<br />
					<a href="/">Go to home</a>
				</div>
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
						canFetchPrevious={
							!isFetchingPreviousPage &&
							hasPreviousPage &&
							(hasAttemptedPreviousFetch || (data.pages.length ?? 0) > 1)
						}
						onEndReached={() => {
							console.log("onEndReached");
							return fetchNextPage();
						}}
						canFetchNext={!isFetchingNextPage && hasNextPage}
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
