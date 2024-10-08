// lib/timestampUtils.js

/**
 * Utility functions for timestamps.
 * @module timestampUtils
 */

/**
 * Get the current timestamp formatted according to the given pattern.
 * Supported patterns: YYYY, MM, DD, HH, mm, ss, SSS
 * @param {string} format - The format string, e.g., "YYYY-MM-DD HH:mm:ss.SSS".
 * @returns {string} - The formatted timestamp.
 */
function getCurrentTimestamp(format = "HH:mm:ss.SSS") {
	const date = new Date();

	// Extract individual date components
	const components = {
		YYYY: date.getFullYear(),
		MM: String(date.getMonth() + 1).padStart(2, "0"), // Months are 0-based
		DD: String(date.getDate()).padStart(2, "0"),
		HH: String(date.getHours()).padStart(2, "0"),
		mm: String(date.getMinutes()).padStart(2, "0"),
		ss: String(date.getSeconds()).padStart(2, "0"),
		SSS: String(date.getMilliseconds()).padStart(3, "0"),
	};

	// Replace the format tokens in the input format string
	return format.replace(
		/YYYY|MM|DD|HH|mm|ss|SSS/g,
		(match) => components[match]
	);
}

module.exports = { getCurrentTimestamp };
