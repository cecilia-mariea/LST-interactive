
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { context, width, height, x, y, color } from "./global.js";


export function drawCanvas(data) {
  context.clearRect(0, 0, width, height);
  if (!data) return; // safeguard
  const rect = 8;
  for (const d of data) {
    context.fillStyle = color(d.LST);
    context.fillRect(x(d.lon), y(d.lat), rect, rect);
  }
}

export function drawLegendOnHeatmap() {
  const svg = d3.select("#overlay");

  // Remove old legend if exists
  svg.select("#legend-gradient-group").remove();

  const svgWidth = +svg.attr("width");
  const svgHeight = +svg.attr("height");

  const legendWidth = 30;       // narrower
  const legendHeight = svgHeight * 0.5; // shorter
  const margin = { top: 150, left: 50 }; // position in left margin

  // Gradient
  const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
  const gradient = defs.select("#legend-gradient").empty()
    ? defs.append("linearGradient").attr("id", "legend-gradient")
    : defs.select("#legend-gradient");

  gradient
    .attr("x1", "0%").attr("y1", "100%")
    .attr("x2", "0%").attr("y2", "0%");

  const nStops = 10;
  const legendDomain = color.domain();
  const step = (legendDomain[1] - legendDomain[0]) / nStops;

  gradient.selectAll("stop").remove();
  for (let i = 0; i <= nStops; i++) {
    const value = legendDomain[0] + i * step;
    gradient.append("stop")
      .attr("offset", `${(i / nStops) * 100}%`)
      .attr("stop-color", color(value));
  }

  // Draw vertical legend rectangle
  const legendGroup = svg.append("g").attr("id", "legend-gradient-group");
    legendGroup.append("text")
    .attr("x", margin.left + legendWidth / 2)
    .attr("y", margin.top + legendHeight + 30)
    .attr("text-anchor", "middle")
    .attr("fill", "#333")
    .style("font-size", "15px")
    .style("font-weight", "bold")
    .text("Temperature (K)");

  legendGroup.append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)")
    .style("stroke", "#333")
    .style("stroke-width", 1);

  // Scale for ticks
  const legendScale = d3.scaleLinear()
    .domain(legendDomain)
    .range([legendHeight + margin.top, margin.top]);

  const legendAxis = d3.axisLeft(legendScale)
    .ticks(6)
    .tickSize(5);

  legendGroup.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(legendAxis)
    .selectAll("text")
    .style("font-size", "12px");
}
export function updateHeatmapDay(day, allData, meanTemps) {
  const entry = allData.find(d => d.day === day);
  if (entry) drawCanvas(entry.data);

  d3.select("#lineGraph").selectAll(".temp-point")
    .attr("fill", d => d.day === day ? "red" : "#f88379")
    .attr("r", d => d.day === day ? 6 : 4);
}

