class ReportGenerator {
	constructor() {
		this.reportData = {
			debug: 0,
			log: 0,
			info: 0,
			warn: 0,
			error: 0,
			fatal: 0,
		};
	}

	incrementLogCount(level) {
		if (this.reportData.hasOwnProperty(level)) {
			this.reportData[level]++;
		}
	}

	generateReport() {
		const totalCalls = Object.values(this.reportData).reduce(
			(acc, val) => acc + val,
			0
		);
		const formatPercentage = (count) =>
			totalCalls ? parseFloat(((count / totalCalls) * 100).toFixed(2)) : 0.0;

		const reportTable = [
			{
				Method: "debug",
				Calls: this.reportData.debug,
				Percentage: formatPercentage(this.reportData.debug),
			},
			{
				Method: "log",
				Calls: this.reportData.log,
				Percentage: formatPercentage(this.reportData.log),
			},
			{
				Method: "info",
				Calls: this.reportData.info,
				Percentage: formatPercentage(this.reportData.info),
			},
			{
				Method: "warn",
				Calls: this.reportData.warn,
				Percentage: formatPercentage(this.reportData.warn),
			},
			{
				Method: "error",
				Calls: this.reportData.error,
				Percentage: formatPercentage(this.reportData.error),
			},
			{
				Method: "fatal",
				Calls: this.reportData.fatal,
				Percentage: formatPercentage(this.reportData.fatal),
			},
		];

		console.table(reportTable, ["Method", "Calls", "Percentage"]);
	}
}

module.exports = ReportGenerator;
