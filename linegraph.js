import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let hoverInitialized = false;
let xScale, yScale, linePath, svg, margin, width, height;

export function drawPixelTimeSeries(pixelTimeSeries) {
  if (!hoverInitialized) {
    margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const containerWidth = 800;
    const containerHeight = 180;
    width = containerWidth - margin.left - margin.right;
    height = containerHeight - margin.top - margin.bottom;

    svg = d3.select("#pixelGraph")
      .html("")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    xScale = d3.scaleLinear().domain([1, 129]).range([0, width]);
    yScale = d3.scaleLinear().domain([250, 300]).range([height, 0]); // temp domain, will update

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(10));

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale));

    linePath = svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    hoverInitialized = true;
  }

  if (!pixelTimeSeries || !pixelTimeSeries.values) return;

  yScale.domain(d3.extent(pixelTimeSeries.values));

  svg.select(".y-axis").call(d3.axisLeft(yScale));

  const line = d3.line()
    .x((d, i) => xScale(i + 1))
    .y(d => yScale(d));

  linePath.datum(pixelTimeSeries.values)
    .attr("d", line);
}
