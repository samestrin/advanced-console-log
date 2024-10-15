// lib/memoryUtils.js

/**
 * Utility functions for memory usage.
 * @module memoryUtils
 */

const { COLORS } = require("./constants");
let v8Module = null;

/**
 * Get the total heap size limit.
 * @returns {number} - The total heap size limit.
 */
function getTotalHeapSizeLimit() {
	if (!v8Module) {
		v8Module = require("v8");
	}
	return v8Module.getHeapStatistics().heap_size_limit;
}

/**
 * Get the memory usage in MB.
 * @param {number} totalHeapSizeLimit - The total heap size limit.
 * @returns {string} - The available memory in MB.
 */
function getMemoryUsage(totalHeapSizeLimit) {
	const memoryUsage = process.memoryUsage();
	const usedHeap = memoryUsage.heapUsed;
	const availableHeap = totalHeapSizeLimit - usedHeap;
	return (availableHeap / 1024 ** 2).toFixed(2);
}

/**
 * Get the memory usage percentage.
 * @param {number} totalHeapSizeLimit - The total heap size limit.
 * @returns {string} - The percentage of available memory.
 */
function getMemoryUsagePercentage(totalHeapSizeLimit) {
	const memoryUsage = process.memoryUsage();
	const usedHeap = memoryUsage.heapUsed;
	const freePercentage =
		((totalHeapSizeLimit - usedHeap) / totalHeapSizeLimit) * 100;
	return freePercentage.toFixed(2);
}

/**
 * Get the memory usage color based on the percentage of available memory.
 * @param {number} freePercentage - The percentage of free memory.
 * @returns {string} - The color code for the memory usage.
 */
function getMemoryUsageColor(freePercentage) {
	if (freePercentage >= 80) return COLORS.WHITE;
	if (freePercentage >= 70) return COLORS.YELLOW;
	if (freePercentage >= 60) return COLORS.ORANGE;
	if (freePercentage >= 50) return COLORS.LIGHT_RED;

	return COLORS.RED;
}

/**
 * Get the formatted memory usage based on the memory display mode.
 * @param {number} totalHeapSizeLimit - The total heap size limit.
 * @param {number} memoryDisplayMode - The display mode for memory usage.
 * @returns {string} - The formatted memory usage.
 */
function getFormattedMemoryUsage(totalHeapSizeLimit, memoryDisplayMode) {
	const memoryInMB = getMemoryUsage(totalHeapSizeLimit);
	const memoryInPercent = getMemoryUsagePercentage(totalHeapSizeLimit);
	const freePercentage = parseFloat(memoryInPercent);
	const color = getMemoryUsageColor(freePercentage);

	switch (memoryDisplayMode) {
		case 1:
			return `${COLORS.WHITE}[${color}${memoryInMB} MB Free${COLORS.WHITE}]${COLORS.RESET} `;
		case 2:
			return `${COLORS.WHITE}[${color}${memoryInPercent}% Free${COLORS.WHITE}]${COLORS.RESET} `;
		case 3:
			return `${COLORS.WHITE}[${color}${memoryInMB} MB Free / ${memoryInPercent}% Free${COLORS.WHITE}]${COLORS.RESET} `;
		default:
			return "";
	}
}

module.exports = {
	getTotalHeapSizeLimit,
	getFormattedMemoryUsage,
};
