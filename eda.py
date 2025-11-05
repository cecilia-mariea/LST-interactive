import s3fs
import xarray as xr 
import datetime as dt
import os 
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
from pyproj import Proj, CRS
import rioxarray as rio

def get_goes18(lyr, idyjl, product, var=None, cache_dir = "./cache_datasets"):
    # Convert julian day to calendar date
    date = dt.datetime(lyr, 1, 1) + dt.timedelta(days=idyjl - 1)
    month = str(date.month).zfill(2)
    day = str(date.day).zfill(2)
    year = str(lyr).zfill(4)
    jday = str(idyjl).zfill(3)

    cache_dir = Path(cache_dir) / product / year / jday
    cache_dir.mkdir(parents=True, exist_ok=True)

    fs = s3fs.S3FileSystem(anon=True)

    bucket =  f"s3://noaa-goes18/{product}/{year}/{jday}/*/*.nc"
    print(bucket)

    file_keys = fs.glob(bucket)
    print(file_keys)
    if not file_keys: 
        raise FileNotFoundError (f"No NetCDF files found in {bucket}")

    s3_path = file_keys[0]
    local_path = cache_dir / os.path.basename(s3_path)

    if not local_path.exists():
        print(f"Downloading {s3_path} -> {local_path}")
        fs.get(s3_path, str(local_path))
    else: 
        print(f"Using cached file: {local_path}")

    ds = xr.open_dataset(local_path, engine="h5netcdf")

    if var: 
        ds = ds[var]

    return ds

ds = get_goes18(2025,155,"ABI-L2-LSTF", var=None)

## Products
# **ABI Products:**

#     **Full Disk (FD):** The S3 directory path will use `[BaseProductCode]F/` (e.g., `ABI-L1b-RadF/`).
#     **CONUS (C):** The S3 directory path will use `[BaseProductCode]C/` (e.g., `ABI-L1b-RadC/`).
#     **Mesoscale (M1/M2):** The S3 directory path will use `[BaseProductCode]M/` (e.g., `ABI-L1b-RadM/`). 

# projection conversion 

# Extract projection attributes
proj_info = ds['goes_imager_projection']

# # Build the geostationary projection
# p = Proj(proj='geos',
#         h=proj_info.perspective_point_height,
#         lon_0=proj_info.longitude_of_projection_origin,
#         sweep=proj_info.sweep_angle_axis,
#         a=proj_info.semi_major_axis,
#         b=proj_info.semi_minor_axis)

# Build CRS directly from GOES projection parameters
goes_crs = CRS.from_proj4(
    f"+proj=geos +h={proj_info.perspective_point_height} "
    f"+lon_0={proj_info.longitude_of_projection_origin} "
    f"+sweep={proj_info.sweep_angle_axis} "
    f"+a={proj_info.semi_major_axis} +b={proj_info.semi_minor_axis} +units=m"
)

# Get x and y in meters (multiply radians by satellite height)
x = ds['x'].values * proj_info.perspective_point_height
y = ds['y'].values * proj_info.perspective_point_height

# Assign new coordinates with correct names
ds = ds.assign_coords({'x': x, 'y': y})

# Pick the variable of interest (height)
ht = ds['LST']
ht = ht.where(np.isfinite(ht), drop=True)

# Attach CRS and x/y coordinate names
ht = ht.rio.write_crs(goes_crs)
ht = ht.rio.set_spatial_dims(x_dim='x', y_dim='y', inplace=False)

# # Build a meshgrid
# X, Y = np.meshgrid(x, y)

# # Convert to lat/lon
# lon, lat = p(X, Y, inverse=True)

# # Add to dataset
# ds = ds.assign_coords({'lon': (('y', 'x'), lon),
#                     'lat': (('y', 'x'), lat)})
# subset = ds.where(
# (ds.lat > -20) & (ds.lat < 55) &
# (ds.lon > -130) & (ds.lon < -70),
# drop=True
# )

from rasterio.enums import Resampling
ht_reproj = ht.rio.reproject("EPSG:4326", resolution=(0.05,0.05), resampling=Resampling.bilinear)

ht_reproj = ht_reproj.rio.clip_box(minx=-180, maxx=-65, miny=20, maxy=55)
print(ht_reproj)
plt.figure()
ht_reproj.plot(cmap='viridis')
plt.show()

# Mask invalid values
# img = plt.pcolormesh(subset['lon'],subset['lat'], ht, cmap='viridis', shading='auto')
# plt.xlabel('Longitude')
# plt.ylabel('Latitude')
# plt.tight_layout()
# plt.show()