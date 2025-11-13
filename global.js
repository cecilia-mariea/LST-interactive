import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// config
let dayToDisplay = 1; // in julian days
const canvas = document.getElementById("mapCanvas");
const context = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;

const minx = -140,
  maxx = -65;
const miny = 20,
  maxy = 55;

//  useable area
const x = d3.scaleLinear().domain([minx, maxx]).range([0, width]);
const y = d3.scaleLinear().domain([miny, maxy]).range([height, 0]);

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

// load data
const numDays = 129; // number of total files
async function preloadData() {
  const filePromises = d3.range(1, numDays + 1).map((day) => {
    const path = `./lib/2024_${String(day).padStart(3, "0")}_LST.json`;
    return d3
      .json(path)
      .then((file) => ({
        day,
        data: file.data,
      }))
      .catch(() => null);
  });
  const results = await Promise.all(filePromises);
  return results.filter((d) => d !== null);
}

// Use a fixed color domain (Kelvin)
const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([250, 300]);

//drawing us overlay
async function drawUSOverlay() {
  try {
    const us = await d3.json("us_lower_48.geo.json");
    
    const overlaySvg = d3.select("#overlay");
    overlaySvg.html("");
    
    // Use a projection that fits the CONUS better
    const projection = d3.geoIdentity()
      .reflectY(true) // Don't flip Y-axis
      .fitExtent([[10, 10], [width - 10, height - 10]], us); // Fit with some padding
    
    const path = d3.geoPath().projection(projection);
    
    // Draw US states
    overlaySvg.selectAll(".state")
      .data(us.features)
      .enter()
      .append("path")
      .attr("class", "us-overlay")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .style("opacity", 0.8);
    
    console.log("US overlay drawn successfully");
      
  } catch (error) {
    console.error("Error loading US overlay:", error);
    // Fallback: draw a simple rectangle to test
    const overlaySvg = d3.select("#overlay");
    overlaySvg.append("rect")
      .attr("x", 50)
      .attr("y", 50)
      .attr("width", 100)
      .attr("height", 100)
      .attr("fill", "red")
      .attr("opacity", 0.5);
  }
}


// map
function drawCanvas(data) {
  context.clearRect(0, 0, width, height);
  const rectSize = 8;
  data.forEach((d) => {
    context.fillStyle = color(d.LST);
    context.fillRect(x(d.lon), y(d.lat), rectSize, rectSize);
  });
}

function calculateMeanTemperatures(allData) {
  return allData.map(dayData => {
    const temps = dayData.data.map(d => d.LST);
    const meanTemp = d3.mean(temps);
    return {
      day: dayData.day,
      date: convertDate(dayData.day),
      meanTemp: meanTemp,
      julianDate: dayData.day
    };
  });
}

// line graph
function drawLineGraph(meanTemps) {
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const graphWidth = 800 - margin.left - margin.right;
  const graphHeight = 300 - margin.top - margin.bottom;

  const svg = d3.select("#lineGraph")
    .attr("width", 800)
    .attr("height", 300)
    .html("");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  //scales
  const xScale = d3.scaleLinear()
    .domain([1, 129])
    .range([0, graphWidth]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(meanTemps, d => d.meanTemp) - 2, d3.max(meanTemps, d => d.meanTemp) + 2])
    .range([graphHeight, 0]);

  //line
  const line = d3.line()
    .x(d => xScale(d.day))
    .y(d => yScale(d.meanTemp))
    .curve(d3.curveMonotoneX);

  // draw line
  g.append("path")
    .datum(meanTemps)
    .attr("class", "temperature-line")
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "#f88379")
    .attr("stroke-width", 2);

  // data points
  g.selectAll(".temp-point")
    .data(meanTemps)
    .enter()
    .append("circle")
    .attr("class", "temp-point")
    .attr("cx", d => xScale(d.day))
    .attr("cy", d => yScale(d.meanTemp))
    .attr("r", 3)
    .attr("fill", "#f88379")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  // axes
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d => convertDate(d).split(' ')[0]); 

  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => `${d.toFixed(1)} K`);
g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${graphHeight})`)
    .call(xAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("x", graphWidth / 2)
    .attr("y", 35)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Date");

  g.append("g")
    .attr("class", "axis")
    .call(yAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -graphHeight / 2)
    .attr("y", -40)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Mean Temperature (K)");

  // grid lines
  g.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${graphHeight})`)
    .call(d3.axisBottom(xScale)
      .tickSize(-graphHeight)
      .tickFormat("")
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.1);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale)
      .tickSize(-graphWidth)
      .tickFormat("")
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.1);
}

// legend
function drawLegend(color) {
  const legendWidth = 350;
  const legendHeight = 30;

  const legendSvg = d3
    .select("#legend")
    .attr("width", legendWidth)
    .attr("height", legendHeight+20);

  legendSvg.html("");

  // Create a linear gradient
  const defs = legendSvg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  const [min, max] = color.domain();
  const steps = d3.range(0, 1.01, 0.1);
  steps.forEach((t) => {
    gradient
      .append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", color(min + t * (max - min)));
  });

  // Draw the bar
  legendSvg
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  // Add numeric axis for temperature
  const legendScale = d3
    .scaleLinear()
    .domain([min, max])
    .range([0, legendWidth]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .ticks(5)
    .tickFormat((d) => `${d.toFixed(0)} K`);

  legendSvg
    .append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(legendAxis);
}

//update day (moved to end)
function update(newDay, allData, meanTemps) {
  displayDate(newDay);
  const dayEntry = allData.find((d) => d.day === newDay);
  if (dayEntry) drawCanvas(dayEntry.data);
  
  // Highlight current day on line graph
  if (meanTemps) {
      d3.select("#lineGraph").selectAll(".temp-point")
        .attr("fill", d => d.day === newDay ? "var(--highlight-color)" : "var(--accent-color)")
        .attr("r", d => d.day === newDay ? 5 : 3);
  }
}

// input slider
function setupSlider(allData, meanTemps) {
  d3.select("#date-slider").on("input", function () {
    const newDay = +this.value;
    update(newDay, allData, meanTemps);
  });
}

let allData = [];
// init
async function init() {
  allData = await preloadData();
  const meanTemps = calculateMeanTemperatures(allData);
  
  drawUSOverlay();
  drawLegend(color);
  drawLineGraph(meanTemps);
  setupSlider(allData, meanTemps);
  //update(dayToDisplay, allData, meanTemps);
  
  console.log("Initialization complete");
}

init();
