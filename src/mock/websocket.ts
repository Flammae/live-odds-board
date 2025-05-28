type SubscribedMatches = Set<string>;

type MatchUpdate = {
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

type SuspendedEvent = {
	type: "suspended";
	matchId: string;
};

type WebSocketMessage = {
	type: "subscribe" | "unsubscribe";
	matchId: string;
};

class MockWebSocket {
	private static instance: MockWebSocket | null = null;
	private static subscribedMatches: SubscribedMatches = new Set();
	private static updateInterval: number | null = null;
	private static readonly UPDATE_INTERVAL_MS = 2000; // Emit updates every 2 seconds
	private listeners: { [key: string]: ((data: string) => void)[] } = {};

	constructor() {
		if (MockWebSocket.instance) {
			return MockWebSocket.instance;
		}
		MockWebSocket.instance = this;

		if (!MockWebSocket.updateInterval) {
			MockWebSocket.startUpdateInterval();
		}
	}

	private static startUpdateInterval() {
		MockWebSocket.updateInterval = window.setInterval(() => {
			MockWebSocket.emitUpdates();
		}, MockWebSocket.UPDATE_INTERVAL_MS);
	}

	private static generateRandomUpdate(matchId: string): MatchUpdate {
		const update: MatchUpdate = {
			type: "update",
			id: matchId,
			score: {
				home: Math.floor(Math.random() * 5),
				away: Math.floor(Math.random() * 5),
			},
			markets: [
				{
					id: "1x2",
					name: "1X2",
					options: [
						{
							id: "1x2_1",
							name: "1",
							odds: Number((Math.random() * 2 + 1).toFixed(2)),
						},
						{
							id: "1x2_X",
							name: "X",
							odds: Number((Math.random() * 2 + 1).toFixed(2)),
						},
						{
							id: "1x2_2",
							name: "2",
							odds: Number((Math.random() * 2 + 1).toFixed(2)),
						},
					],
				},
				{
					id: "double_chance",
					name: "Double Chance",
					options: [
						{
							id: "double_chance_1X",
							name: "1X",
							odds: Number((Math.random() * 2 + 1).toFixed(2)),
						},
						{
							id: "double_chance_12",
							name: "12",
							odds: Number((Math.random() * 2 + 1).toFixed(2)),
						},
						{
							id: "double_chance_X2",
							name: "X2",
							odds: Number((Math.random() * 2 + 1).toFixed(2)),
						},
					],
				},
				{
					id: "total",
					name: "Total",
					options: [
						{
							id: "total_Over 2.5",
							name: "Over 2.5",
							odds: Number((Math.random() * 2 + 1).toFixed(2)),
						},
						{
							id: "total_Under 2.5",
							name: "Under 2.5",
							odds: Number((Math.random() * 2 + 1).toFixed(2)),
						},
					],
				},
			],
			lastUpdated: new Date().toISOString(),
		};

		return update;
	}

	private static emitUpdates() {
		if (MockWebSocket.subscribedMatches.size === 0) return;

		const instance = MockWebSocket.instance;
		if (!instance) return;

		// Randomly emit a suspended event for one of the subscribed matches (10% chance)
		if (Math.random() < 0.1) {
			const subscribedMatchesArray = Array.from(
				MockWebSocket.subscribedMatches
			);
			const randomMatchId =
				subscribedMatchesArray[
					Math.floor(Math.random() * subscribedMatchesArray.length)
				];

			const suspendedEvent: SuspendedEvent = {
				type: "suspended",
				matchId: randomMatchId,
			};
			instance.dispatchEvent("message", JSON.stringify(suspendedEvent));
		}

		// Emit updates for subscribed matches
		MockWebSocket.subscribedMatches.forEach((matchId) => {
			if (Math.random() < 0.5) {
				const update = MockWebSocket.generateRandomUpdate(matchId);
				instance.dispatchEvent("message", JSON.stringify(update));
			}
		});
	}

	addEventListener(type: string, listener: (data: string) => void) {
		if (!this.listeners[type]) {
			this.listeners[type] = [];
		}
		this.listeners[type].push(listener);
	}

	removeEventListener(type: string, listener: (data: string) => void) {
		if (!this.listeners[type]) return;
		this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
	}

	dispatchEvent(type: string, data: string) {
		const listeners = this.listeners[type] || [];
		listeners.forEach((listener) => listener(data));
	}

	send(data: string) {
		try {
			const message: WebSocketMessage = JSON.parse(data);
			switch (message.type) {
				case "subscribe":
					MockWebSocket.subscribedMatches.add(message.matchId);
					console.log(`Subscribed to match: ${message.matchId}`);
					break;
				case "unsubscribe":
					MockWebSocket.subscribedMatches.delete(message.matchId);
					console.log(`Unsubscribed from match: ${message.matchId}`);
					break;
			}
		} catch (error) {
			console.error("Error parsing message:", error);
		}
	}

	static cleanup() {
		if (MockWebSocket.updateInterval) {
			window.clearInterval(MockWebSocket.updateInterval);
			MockWebSocket.updateInterval = null;
		}
		MockWebSocket.subscribedMatches.clear();
		MockWebSocket.instance = null;
	}
}

export { MockWebSocket };
