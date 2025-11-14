# Project 3 Write-up

## Visual Encodings

### Heatmap for Spatial Temperature Distribution

- **Color encoding:** We used a color gradient scale (Turbo, from 250 K to 300 K) to represent temperature. Any missing data was left white. This allows viewers to immediately observe any spatial patterns of surface temperature. We used a a function to find the temperature (LST) of the pixel closest to a given longitude and latitude.

- **Map elements:** We chose a linear Cartesian projection for the contiguous U.S., which creates a simple outline of the US, the area in which we are looking to show patterns. We also added a color gradient legend to display a reference for the colors shown. 

### Line Graph for Time Series

- **Position encoding:** The x-axis encodes time (day/date), while the y-axis encodes temperature in Kelvin. 

- **Shape encoding:** Each individual day has an associated point.

- **Y-axis scaling:** The y-axis (minimum, maximum, and range of K) adjusts automatically based on the selected pixel’s associated data (temperature readings over the time period), ensuring a more individualized display for each longitude and latitude.

### Interaction Techniques

- **Hover:** Moving the mouse over the heatmap shows the temperature at the hovered-upon location, depending on the day selected. A tooltip provides the longitude and latitude, rounded to two decimal places for succinctness, and the temperature. This is a balance between expressiveness and effectiveness.

- **Click:** Clicking a location locks it on the temperature line graph so users can take a closer look at the temperature distribution over time for one specific location.   to Lock Selection

- **Slider and Dropdown:** Both elements allow viewers to select a specific day of the year, and interacting with one updates the other one as well as updating the heatmap for that specific day. 

## Development Process

### Data Preprocessing

The first step was pulling from the AWS API using the s3 File System. We utilized this website to understand the channels available and how to path to them. After, we implemented a system that downloaded the dataset if we had never requested it prior or used the already local copy of the data set. This allowed for fast prototyping. Then we utilized xarrays to parse the large metadata sets to get the target variable, Land Surface Temperature (LST). Each product of the GOES18 dataset also includes information about the satellite trajectory to transform the data from the satellite axes to latitude and longitude. This required use of python projection packages. After transformation, we clipped the data to focus specifically around the lower 48 states of the US. Taking the mean of all the LST scans taken in a single day, we organized the coordinates and corresponding temperatures into static json files (one per day). The transformation was computationally expensive, so we tried reducing the resolution, but running the preprocessing script for ~4 hours only resulted in 129 days of parsed data. The resolution of the dataset also required using \<canvas\> tags for pixel mapping, rather than \<svg\> for vectorized objects.

### Visualizations, Style, and Interaction

- **Map and Projection Setup:** created a canvas for the heatmap and used D3 scales for x (longitude) and y (latitude) mapping, adding D3 geoTransform to map longitude/latitude to canvas pixels.

- **Heatmap Rendering:** intiated heatmap with an overlay for interaction, adding hover interactions to detect mouse:pixel location and retrieve temperature data.

- **Line Graph Development:** built an SVG line graph with dynamic y-scaling, line and point differentiation, and  

- **Interaction:** connected hover, click, slider, and dropdown events to update heatmap and line graph dynamically.

### Alternate Considerations/Extras

- We considered displaying the mean temperature line in the background for the line graph but removed it because it contributed to visual clutter and was additionally not super relevant to the user. 
- We explored displaying the line plot on the tooltip with hover, but this was too visually overwhelming with mouse movement and caused a lot of crashes. The plot on the side allows us to balance effectiveness and expressiveness.

### Reflection

- We spent around 

