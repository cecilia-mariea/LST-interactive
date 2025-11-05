import s3fs
import xarray as xr 
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from pyproj import Proj, CRS
import rioxarray as rio
from rasterio.enums import Resampling
import json, os, time
from datetime import datetime,timedelta

def parse_goes_time(filename):
    time_str = Path(filename).name[:-3].split("_")[-1][1:]
    year = int(time_str[:4])
    jday = int(time_str[4:7])
    hour = int(time_str[7:9])
    minute = int(time_str[9:11])
    second = int(time_str[11:13])
    return datetime(year, 1, 1) + timedelta(days=jday-1, hours=hour, minutes=minute, seconds=second)

def get_goes18_2024(product, cache_dir="./cache_datasets", output_dir="./lib"): 
    
    year = 2024
    cache_dir = Path(cache_dir) / product / str(year)
    cache_dir.mkdir(parents=True, exist_ok=True)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    fs = s3fs.S3FileSystem(anon=True) 
    daily_means_list = []

    for jday in range(1, 32):  # example: first day
        bucket_prefix = f"s3://noaa-goes18/{product}/{year}/{jday:03d}"
        file_keys = fs.glob(f"{bucket_prefix}/*/*.nc")

        if not file_keys: 
            print(f"No files found for {year}-{jday}. Continuing...")
            continue
        
        lst_list = []

        for s3_path in file_keys:
            local_path = cache_dir / str(jday) / os.path.basename(s3_path)
            if not local_path.exists(): 
                print(f"Downloading {s3_path} -> {local_path}")
                fs.get(s3_path, str(local_path))

            ds = xr.open_dataset(local_path, engine="h5netcdf")
            LST = ds['LST'].where(np.isfinite(ds['LST']), drop=False)

            proj_info = ds['goes_imager_projection']
            goes_crs = CRS.from_proj4(
                f"+proj=geos +h={proj_info.perspective_point_height} "
                f"+lon_0={proj_info.longitude_of_projection_origin} "
                f"+sweep={proj_info.sweep_angle_axis} "
                f"+a={proj_info.semi_major_axis} +b={proj_info.semi_minor_axis} +units=m"
            ) 

            x = ds["x"].values * proj_info.perspective_point_height
            y = ds["y"].values * proj_info.perspective_point_height
            LST = LST.assign_coords({"x": x, "y": y})

            LST = LST.rio.write_crs(goes_crs)
            LST = LST.rio.set_spatial_dims(x_dim="x", y_dim="y", inplace=False)

            # Reproject to lat/lon
            LST_reproj = LST.rio.reproject(
                "EPSG:4326", resolution=(0.05, 0.05), resampling=Resampling.bilinear
            )
            LST_reproj = LST_reproj.rio.clip_box(minx=-180, maxx=-65, miny=20, maxy=55)

            t = parse_goes_time(local_path)
            LST = LST.expand_dims(time=[t])

            lst_list.append(LST_reproj) 

            ds.close()

        ds_day = xr.concat(lst_list, dim='time')

        daily_mean_spatial = ds_day.mean("time", skipna=True)
        daily_mean_spatial = daily_mean_spatial.isel(
            x=slice(None,None,4), y=slice(None,None,4)
        )
           
        # Convert to JSON
        lats = daily_mean_spatial['y'].values
        lons = daily_mean_spatial['x'].values
        data_list = []
        for i, lat in enumerate(lats):
            for j, lon in enumerate(lons):
                val = daily_mean_spatial.values[i,j]
                if np.isfinite(val):
                    data_list.append({"lat": float(lat), "lon": float(lon), "LST": float(val)})

        # Save per-day JSON
        out_file = output_dir / f"{year}_{jday:03d}_LST.json"
        with open(out_file, "w") as f:
            json.dump({"date": f"{year}-{jday:03d}", "data": data_list}, f)

        # Daily mean for line graph
        daily_mean_value = daily_mean_spatial.mean().item()
        daily_means_list.append({"date": f"{year}-{jday:03d}", "mean_LST": daily_mean_value})

        time.sleep(1)

    # Save daily mean JSON
    with open(output_dir / "daily_mean_LST_US.json", "w") as f:
        json.dump(daily_means_list, f)

    print("Processing complete.")

# call
get_goes18_2024("ABI-L2-LSTF")
