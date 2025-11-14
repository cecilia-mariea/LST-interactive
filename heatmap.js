
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


export function drawLegend() {
  const svg = document.querySelector("#legend");
  svg.innerHTML = "";

  const w = 350, h = 20;
  const ns = "http://www.w3.org/2000/svg";

  const defs = document.createElementNS(ns, "defs");
  const gradient = document.createElementNS(ns, "linearGradient");
  gradient.setAttribute("id", "legGradient");
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("x2", "100%");
  defs.appendChild(gradient);
  svg.appendChild(defs);

  for (let t = 0; t <= 1; t += 0.02) {
    const stop = document.createElementNS(ns, "stop");
    stop.setAttribute("offset", `${t*100}%`);
    stop.setAttribute("stop-color", color(250 + t*50));
    gradient.appendChild(stop);
  }

  const rectEl = document.createElementNS(ns, "rect");
  rectEl.setAttribute("width", w);
  rectEl.setAttribute("height", h);
  rectEl.setAttribute("fill", "url(#legGradient)");
  svg.appendChild(rectEl);

  const scale = d3.scaleLinear().domain([250, 300]).range([0, w]);
  const axis = d3.axisBottom(scale).ticks(5);

  const axisG = d3.select(svg).append("g")
    .attr("transform", `translate(0,${h})`)
    .call(axis);
}

export function updateHeatmapDay(day, allData, meanTemps) {
  const entry = allData.find(d => d.day === day);
  if (entry) drawCanvas(entry.data);

  d3.select("#lineGraph").selectAll(".temp-point")
    .attr("fill", d => d.day === day ? "red" : "#f88379")
    .attr("r", d => d.day === day ? 6 : 4);
}

