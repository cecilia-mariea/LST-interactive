import json
import random
from pathlib import Path

# Input/output directories
input_dir = Path("./lib")
output_dir = Path("./lib_filtered")
output_dir.mkdir(exist_ok=True)

# Bounding box
minx, maxx = -140, -65
miny, maxy = 20, 55

# Fraction of points to keep
sample_fraction = 0.8

# Loop through all JSON files
for json_file in input_dir.glob("2024_*.json"):
    with open(json_file, "r") as f:
        data = json.load(f)

    # Filter points within bounding box
    filtered_points = [
        pt for pt in data["data"]
        if minx <= pt["lon"] <= maxx and miny <= pt["lat"] <= maxy
    ]

    # Randomly sample ~80%
    sampled_points = [
        pt for pt in filtered_points if random.random() < sample_fraction
    ]

    # Save filtered file
    new_data = {
        "date": data["date"],
        "data": sampled_points
    }

    output_file = output_dir / json_file.name
    with open(output_file, "w") as f_out:
        json.dump(new_data, f_out)
    
    print(f"Processed {json_file.name}: {len(sampled_points)} points")