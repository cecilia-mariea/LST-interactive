import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { width, height, x, y, projection } from "./global.js";

export async function drawUSOverlay() {
  const svg = d3.select("#overlay");
  svg.html("");

  const us = await d3.json("./us_lower_48.geo.json");
  const path = d3.geoPath().projection(projection);

  // US boundaries
  svg.append("g")
    .selectAll("path")
    .data(us.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("class", "us-overlay");

  const longitudes = d3.range(-140, -60, 5);
  const latitudes = d3.range(20, 60, 5);

  svg.append("g")
    .selectAll(".lon-line")
    .data(longitudes)
    .enter()
    .append("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "lightgray")
    .attr("stroke-width", 1)
    .attr("opacity", 0.6);

  svg.append("g")
    .selectAll(".lat-line")
    .data(latitudes)
    .enter()
    .append("line")
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("x1", 0)
    .attr("x2", width)
    .attr("stroke", "lightgray")
    .attr("stroke-width", 1)
    .attr("opacity", 0.6);
}
