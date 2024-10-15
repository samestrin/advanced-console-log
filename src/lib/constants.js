// lib/constants.js

/**
 * Color constants for log messages.
 * @module constants
 */
const COLORS = {
	LIGHT_GREEN: "\u001b[92m", // For INFO
	GREEN: "\u001b[32m", // For LOG
	LIGHT_BLUE: "\u001b[94m", // For timestamps
	YELLOW: "\x1b[33m", // For WARN
	LIGHT_RED: "\u001b[91m", // For ERROR
	RED: "\u001b[31m", // For memory usage
	LIGHT_CYAN: "\u001b[96m", // For inline caller info
	CYAN: "\u001b[36m", // For DEBUG
	LIGHT_MAGENTA: "\u001b[95m", // For caller info
	MAGENTA: "\u001b[35m", // For FATAL
	LIGHT_GRAY: "\u001b[37m", // Light grey
	DARK_GRAY: "\u001b[90m", // Dark grey
	WHITE: "\u001b[97m", // White
	ORANGE: "\u001b[93m", // Bright yellow (approximation for orange)
	RESET: "\u001b[0m", // Reset color
};

module.exports = { COLORS };
