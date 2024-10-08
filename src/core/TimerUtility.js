class TimerUtility {
	constructor() {
		this.timers = {};
	}

	startTimer(label) {
		this.timers[label] = process.hrtime.bigint();
	}

	stopTimer(label) {
		if (!this.timers[label]) {
			return null;
		}
		const elapsed = process.hrtime.bigint() - this.timers[label];
		delete this.timers[label];
		const elapsedTime = `${Number(elapsed / BigInt(1e9))}s ${
			Number(elapsed % BigInt(1e9)) / 1e6
		}ms`;
		return elapsedTime;
	}

	getTimer(label) {
		if (!this.timers[label]) {
			return null;
		}
		const elapsed = process.hrtime.bigint() - this.timers[label];
		return Number(elapsed / BigInt(1e6)); // Return in milliseconds
	}

	clearAllTimers() {
		this.timers = {};
	}
}

module.exports = TimerUtility;
