import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const graphHeight = 180 - margin.top - margin.bottom;

let svg, g, xScale, yScale, lineGroup, xAxisGroup, yAxisGroup;

export function drawLineGraph(data, allData, yLabel = "Temperature (K)", xLabel = "Date",) {
  svg = d3.select("#pixelGraph");
  svg.html("");

  const graphWidth = +svg.attr("width") - margin.left - margin.right;
  g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  xScale = d3.scalePoint()
    .domain(allData.map(d => convertDate(d.day)))
    .range([0, graphWidth]);

  // Y scale dynamically based on meanTemp
  yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.meanTemp) - 2, d3.max(data, d => d.meanTemp) + 2])
    .range([graphHeight, 0]);

  // axes
  xAxisGroup = g.append("g")
  .attr("transform", `translate(0,${graphHeight})`)
  .call(d3.axisBottom(xScale)
    .tickValues(xScale.domain().filter((d,i) => i % 10 === 0))
  )
  .selectAll("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-45)")
  .attr("dx", "-0.5em")
  .attr("dy", "0.5em");

  yAxisGroup = g.append("g")
    .call(d3.axisLeft(yScale));

  // axis labels
  g.append("text")
    .attr("x", graphWidth / 2)
    .attr("y", graphHeight + 60)
    .attr("text-anchor", "middle")
    .text(xLabel);

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -graphHeight / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .text(yLabel);

  // Container for hover/click points
  lineGroup = g.append("g").attr("class", "hover-line-points");
}

export function drawPixelTimeSeries(pixelData, allData) {
  if (!svg) return;
  lineGroup.html(""); // clear previous hover/click points

  // Dynamically adjust Y scale based on pixel values
  yScale.domain([d3.min(pixelData.values) - 1, d3.max(pixelData.values) + 1]);
  yAxisGroup.call(d3.axisLeft(yScale));

  // Line path
  const line = d3.line()
    .x((d, i) => xScale(convertDate(i + 1)))
    .y(d => yScale(d));

  lineGroup.append("path")
    .datum(pixelData.values)
    .attr("class", "temperature-line")
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "#ff4444")
    .attr("stroke-width", 2);

  // Points for hover
  lineGroup.selectAll(".temp-point")
    .data(pixelData.values)
    .enter()
    .append("circle")
    .attr("class", "temp-point")
    .attr("cx", (d, i) => xScale(convertDate(i + 1)))
    .attr("cy", d => yScale(d))
    .attr("r", 3)
    .attr("fill", "#ff4444");

  
  }


// Clears only hover/click lines
export function clearPixelGraph() {
  if (lineGroup) lineGroup.html("");
}

// Helper to convert day number to string (needed in linegraph)
function convertDate(jDay) {
  const janFirst = new Date("2024-01-01T00:00:00Z");
  const targetDate = new Date(janFirst.setDate(janFirst.getDate() + jDay));
  const formatFullMonth = d3.timeFormat("%B");
  const month = formatFullMonth(targetDate);
  const day = targetDate.getDate();
  return `${month} ${day}`;
}
