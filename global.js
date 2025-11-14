import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { drawUSOverlay} from "./usmap.js";
import { drawCanvas, drawLegendOnHeatmap, updateHeatmapDay } from "./heatmap.js";
import { drawLineGraph, drawPixelTimeSeries, clearPixelGraph } from "./linegraph.js";

//defining global variables & projections
export const canvas = document.getElementById("mapCanvas");
export const context = canvas.getContext("2d");
export const width = canvas.width;
export const height = canvas.height;

export const minx = -140, maxx = -65;
export const miny = 20,  maxy = 55;

export const x = d3.scaleLinear().domain([minx, maxx]).range([0, width]);
export const y = d3.scaleLinear().domain([miny, maxy]).range([height, 0]);

export const projection = d3.geoTransform({
  point: function(lon, lat) {
    this.stream.point(x(lon), y(lat));
  }
});

export const color = d3.scaleSequential(d3.interpolateTurbo).domain([250, 300]);
export const numDays = 129;

export let pixelTimeSeries = { lat: null, lon: null, values: [] };
let allData = [];
let meanTemps = [];
let clickLocked = false;

//tooltip setup
const tooltip = d3.select("body").append("div")
  .attr("id", "tooltip")
  .attr("class", "tooltip");

//loading data
async function preloadData() {
  const promises = d3.range(1, numDays + 1).map(day =>
    d3.json(`./lib/2024_${String(day).padStart(3, "0")}_LST.json`)
      .then(data => ({ day, data: data.data }))
      .catch(() => null)
  );
  const results = await Promise.all(promises);
  return results.filter(Boolean);
}

//getting daily means
function calculateMeanTemperatures(allData) {
  return allData.map(d => ({
    day: d.day,
    meanTemp: d3.mean(d.data, v => v.LST)
  }));
}

//finding closest pixel temperature
function findClosestTemp(dayData, lon, lat) {
  let minDist = Infinity, lst = null;
  for (const p of dayData) {
    const d = Math.hypot(p.lon - lon, p.lat - lat);
    if (d < minDist) { minDist = d; lst = p.LST; }
  }
  return lst;
}

// data formating
function convertDate(jDay) {
  // convert julian day to month/day/year format for 2024
  const janFirst = new Date("2024-01-01T00:00:00Z");
  const targetDate = new Date(janFirst.setDate(janFirst.getDate() + jDay));
  const formatFullMonth = d3.timeFormat("%B");

  const month = formatFullMonth(targetDate); // Months are zero-indexed
  const day = targetDate.getDate();
  return `${month} ${day}, 2024`;
}

function displayDate(jDay) {
  const dateStr = convertDate(jDay);
  d3.select("#date").text(`Date: ${dateStr}`);
}

//initialize visualization
async function init() {
  allData = await preloadData();
  meanTemps = calculateMeanTemperatures(allData);

  drawUSOverlay();
  drawCanvas(allData[0].data);
  drawLegendOnHeatmap();
  drawLineGraph(meanTemps, allData, "Temperature (K)", "Day"); 

  // date display and initial heatmap
  const slider = d3.select("#date-slider");
  const dateDropdown = d3.select("#date-dropdown");
  slider.on("input", function() {
    const day = +this.value;
  dateDropdown.property("value", day);  // sync dropdown
  displayDate(day);
  updateHeatmapDay(day, allData, meanTemps);
  if (pixelTimeSeries.lat !== null) {
    drawPixelTimeSeries(pixelTimeSeries, allData);
  }
});

  dateDropdown.selectAll("option")
    .data(allData)
    .enter()
    .append("option")
    .attr("value", d => d.day)
    .text(d => convertDate(d.day));
  dateDropdown.on("change", function() {
    const day = +this.value;
    slider.property("value", day);
    displayDate(day);
    updateHeatmapDay(day, allData, meanTemps);
    if (pixelTimeSeries.lat !== null) {
      drawPixelTimeSeries(pixelTimeSeries, allData);
    }
  });

  const initialDay = 1;
  slider.property("value", initialDay);
  dateDropdown.property("value", initialDay);
  displayDate(initialDay);
  updateHeatmapDay(initialDay, allData, meanTemps);

  const title = d3.select("#pixel-graph-title");

  // canvas hover interaction
  canvas.addEventListener("mousemove", (e) => {
    
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  const lon = x.invert(cx);
  const lat = y.invert(cy);

  const dayEntry = allData[slider.property("value") - 1];
  const lst = findClosestTemp(dayEntry.data, lon, lat);
  
  //tooltip display
  tooltip
    .style("display", "block")
    .style("left", `${e.pageX + 10}px`)
    .style("top", `${e.pageY + 10}px`)
    .html(`Lon: ${lon.toFixed(2)}, Lat: ${lat.toFixed(2)}<br>LST: ${lst?.toFixed(2)} K`);

  if (!clickLocked) {
    clearPixelGraph();
    pixelTimeSeries = { lat, lon, values: allData.map(d => findClosestTemp(d.data, lon, lat)) };
    drawPixelTimeSeries(pixelTimeSeries, allData, slider.property("value"));
    d3.select("#pixel-graph-title").text(`Temperature at ${lon.toFixed(2)}, ${lat.toFixed(2)} Over Time`);
  }
});

canvas.addEventListener("mouseleave", () => {
    tooltip.style("display","none");
    if (!clickLocked) clearPixelGraph();
    if (!clickLocked) title.text("Temperature at Selected Location Over Time");
  });

// click to “lock” the current pixel selection
canvas.addEventListener("click", (e) => {
  clickLocked = true;
  
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  const lon = x.invert(cx);
  const lat = y.invert(cy);

  
  pixelTimeSeries = { lat, lon, values: allData.map(d => findClosestTemp(d.data, lon, lat)) };
  drawPixelTimeSeries(pixelTimeSeries, allData,slider.property("value"));
  title.text(`Temperature at ${lon.toFixed(2)}, ${lat.toFixed(2)} Over Time`);
});


  d3.select("body").on("click", function(e){
    if (!canvas.contains(e.target)) {
      clickLocked = false;
      clearPixelGraph();
    }

});
}

init();
