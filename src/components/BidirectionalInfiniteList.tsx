import {
	useWindowVirtualizer,
	type VirtualItem,
} from "@tanstack/react-virtual";
import * as React from "react";

type Props<T extends { id: string | number }> = {
	rows: T[];
	rowHeight: number;
	renderItem: (item: T) => React.ReactNode;
	edgeReachedThreshold: number;
	onStartReached: () => void;
	onEndReached: () => void;
	canFetchPrevious: boolean;
	canFetchNext: boolean;
	scrollMargin: number;
	onChange: (visibleItems: T[], sync: boolean) => void;
};

export function BidirectionalInfiniteList<T extends { id: string | number }>({
	rows,
	rowHeight: height,
	renderItem,
	edgeReachedThreshold: requestMoreThreshold,
	onStartReached: onRequestPrevious,
	canFetchPrevious,
	onEndReached: onRequestNext,
	canFetchNext,
	scrollMargin,
	onChange,
}: Props<T>) {
	const virtualizer = useWindowVirtualizer({
		count: rows.length,
		estimateSize: () => height,
		overscan: 5,
		getItemKey: (index) => rows[index].id,
		scrollMargin: scrollMargin,
		onChange: (virtualizer, sync) => {
			const virtualItems = virtualizer.getVirtualItems();

			// pass onChange event
			const visibleItems = virtualItems
				.filter((item) => {
					// remove overscan items
					return (
						item.start <
							virtualizer.scrollRect!.height + virtualizer.scrollOffset! &&
						item.end > virtualizer.scrollOffset!
					);
				})
				.map((item) => {
					return rows[item.index];
				});

			onChange(visibleItems, sync);

			// handle requesting previous & next items
			const firstVisibleItem = virtualItems[0];
			const lastVisibleItem = virtualItems[virtualItems.length - 1];
			if (
				canFetchPrevious &&
				firstVisibleItem &&
				firstVisibleItem.index <= requestMoreThreshold
			) {
				onRequestPrevious();
			}

			if (
				canFetchNext &&
				lastVisibleItem &&
				lastVisibleItem.index >= rows.length - requestMoreThreshold
			) {
				onRequestNext();
			}
		},
	});

	const virtualItems = virtualizer.getVirtualItems();

	/**
	 * When rows change, find the first visible item from the old
	 * virtualized list that's also present in the new rows and scroll to it
	 */
	const oldRows = React.useRef<T[]>([]);
	const oldVirtualItems = React.useRef<VirtualItem[]>([]);

	React.useLayoutEffect(() => {
		if (oldRows.current === rows) {
			return;
		}

		const firstCommonVisibleItem = findFirstCommon(
			oldVirtualItems.current.map((item) => item.key.toString()),
			rows.map((row) => row.id.toString())
		);

		if (!firstCommonVisibleItem) {
			return;
		}

		const oldIndex = oldRows.current.findIndex(
			(row) => row.id.toString() === firstCommonVisibleItem
		);
		const newIndex = rows.findIndex(
			(row) => row.id.toString() === firstCommonVisibleItem
		);
		const diff = newIndex - oldIndex;

		virtualizer.scrollBy(diff * height);
	}, [rows, height, virtualizer]);

	React.useEffect(() => {
		oldRows.current = rows;
	}, [rows]);

	React.useEffect(() => {
		oldVirtualItems.current = virtualItems;
	}, [virtualItems]);

	return (
		<div
			style={{
				height: `${virtualizer.getTotalSize()}px`,
				width: "100%",
				position: "relative",
			}}
		>
			{virtualItems.map((item) => (
				<div
					key={item.key}
					data-id={item.key}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: `${item.size}px`,
						transform: `translateY(${
							item.start - virtualizer.options.scrollMargin
						}px)`,
					}}
				>
					{renderItem(rows[item.index])}
				</div>
			))}
		</div>
	);
}
function findFirstCommon(haystack: string[], needles: string[]) {
	const haystackSet = new Set(haystack);

	const item = needles.find((needle) => haystackSet.has(needle));

	if (!item) {
		return null;
	}

	return item;
}
