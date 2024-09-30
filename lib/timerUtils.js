// lib/timerUtils.js

/**
 * Utility functions for timers.
 * @module timerUtils
 */

/**
 * Start a timer with a specific label.
 * @param {Object} timers - The timers object.
 * @param {string} label - The label for the timer.
 */
function startTimer(timers, label) {
	timers[label] = process.hrtime.bigint();
}

/**
 * Stop a timer with a specific label and return the elapsed time.
 * @param {Object} timers - The timers object.
 * @param {string} label - The label for the timer.
 * @returns {string|null} - The formatted elapsed time or null if timer doesn't exist.
 */
function stopTimer(timers, label) {
	if (!timers[label]) {
		return null;
	}
	const elapsed = process.hrtime.bigint() - timers[label];
	delete timers[label];
	const elapsedTime = `${Number(elapsed / BigInt(1e9))}s ${
		Number(elapsed % BigInt(1e9)) / 1e6
	}ms`;
	return elapsedTime;
}

/**
 * Get the elapsed time for a specific timer label.
 * @param {Object} timers - The timers object.
 * @param {string} label - The label for the timer.
 * @returns {number|null} - The elapsed time in milliseconds or null if timer doesn't exist.
 */
function getTimer(timers, label) {
	if (!timers[label]) {
		return null;
	}
	const elapsed = process.hrtime.bigint() - timers[label];
	return Number(elapsed / BigInt(1e6)); // milliseconds
}

module.exports = {
	startTimer,
	stopTimer,
	getTimer,
};
