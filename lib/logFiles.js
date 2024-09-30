// ../lib/logfiles.js

const fs = require("fs");
const path = require("path");

/**
 * Check if the current log file size has reached the maximum limit.
 * Rotate the file if needed.
 * @param {string} logFilePath - The full path to the log file.
 * @param {number} maxLogFileSizeMB - Maximum allowed file size in MB.
 * @param {number} maxLogFiles - Maximum number of retained log files.
 */
function handleLogFileRotation(logFilePath, maxLogFileSizeMB, maxLogFiles) {
	try {
		const stats = fs.statSync(logFilePath);
		const fileSizeInMB = stats.size / (1024 * 1024); // Convert bytes to MB

		if (fileSizeInMB >= maxLogFileSizeMB) {
			rotateLogFiles(logFilePath, maxLogFiles);
		}
	} catch (err) {
		// If file doesn't exist or there's an error, do nothing
		if (err.code !== "ENOENT") {
			console.error(`Error checking log file size: ${err.message}`);
		}
	}
}

/**
 * Rotate log files by renaming the current log file and maintaining the maximum number of files.
 * @param {string} logFilePath - The full path to the log file.
 * @param {number} maxLogFiles - Maximum number of retained log files.
 */
function rotateLogFiles(logFilePath, maxLogFiles) {
	const logDir = path.dirname(logFilePath);
	const baseFilename = path.basename(logFilePath, path.extname(logFilePath));
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // e.g., 2023-05-12T14-30-00-000

	// Rename the current log file with a timestamp
	const rotatedFilename = `${baseFilename}-${timestamp}.log`;
	fs.renameSync(logFilePath, path.join(logDir, rotatedFilename));

	// Remove old log files if they exceed the maximum count
	const logFiles = fs
		.readdirSync(logDir)
		.filter((file) => file.startsWith(baseFilename) && file.endsWith(".log"))
		.sort(
			(a, b) =>
				fs.statSync(path.join(logDir, b)).mtimeMs -
				fs.statSync(path.join(logDir, a)).mtimeMs
		); // Sort by modification time

	// Delete oldest files exceeding the limit
	while (logFiles.length > maxLogFiles) {
		const oldestFile = logFiles.pop();
		fs.unlinkSync(path.join(logDir, oldestFile));
	}
}

module.exports = {
	handleLogFileRotation,
	rotateLogFiles,
};
