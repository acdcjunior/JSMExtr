// const functionMetrics = functionMetricsFromJsAST(jsASTs);
const fs = require('fs');
const Metrics = require('../metrics/Metrics');

function rReadableMetrics(functionMetricsOnly, fileName) {

    let toPrint = {
        functionName: [],
        fileLocation: []
    };

    Metrics.trackedMetrics.forEach(trackedMetric => {
        toPrint[trackedMetric] = [];
    });

    functionMetricsOnly.forEach(f => {
        toPrint.functionName.push(extractFunctionName(f, toPrint.functionName.length));
        toPrint.fileLocation.push(f.loc);

        Metrics.trackedMetrics.forEach(trackedMetric => {
            let thisMetricsValueForCurrentFunction = (f.metrics && f.metrics[trackedMetric]) || 0;
            toPrint[trackedMetric].push(thisMetricsValueForCurrentFunction);
        });
    });

    let listsContent = `
        functionName = c("${toPrint.functionName.join('", "')}"),
        fileLocation = c("${toPrint.fileLocation.join('", "')}"),`;
    Metrics.trackedMetrics.forEach(trackedMetric => {
        listsContent += `\n\t\t${trackedMetric} = c(${toPrint[trackedMetric].join(", ")}),`;
    });
    listsContent = listsContent.substring(0, listsContent.length-1); // remove last comma

    let metricsColumnNames = '"' + Metrics.trackedMetrics.join('", "') + '"';

    let fileContent = `
js <- structure(
    list(${listsContent}
    ),
    .Names = c("functionName", "fileLocation", ${metricsColumnNames}),
    class = "data.frame",
    row.names = c(NA, ${toPrint.functionName.length}L)
)`;

    fs.writeFileSync(fileName, fileContent);

    return fileContent;
}

function extractFunctionName(f, order) {
    let functionName = f.functionName;
    if (f._type === 'FunctionExpression') {
        // if there's no functionName, return the text with everything before the first '?' removed
        functionName = (f.functionName || f.loc.replace(/^[^?]+\?/, "")) + ' (expr)';
    }
    return `[${order}] ${functionName}`;
}

module.exports = rReadableMetrics;