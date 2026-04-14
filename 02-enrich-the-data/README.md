# Step 2 — Enrich the Data

## Goal

You have a list of geographic tracks (SpatialData). Now you want to enrich each track with additional data from the Open Data Hub — for example nearby points of interest such as gastronomies, water refillment points, webcams, or anything else you find interesting in the API.

**The choice of enrichment data is yours.** Explore the available datasets, pick what makes sense for your tracks, and match it spatially.

> **Keep in mind:** some datasets in the Open Data Hub Content Api are only available for South Tyrol (e.g. gastronomies, water refillment points), while others cover a broader area (e.g. webcams). If your enrichment data is limited to South Tyrol, make sure to filter the SpatialData tracks to a geographically matchable subset first.

In this example we will enrich tracks with:
- **Gastronomies** — places where you can eat or drink (South Tyrol only)
- **Water refillment points** — drinking water stops along the way (South Tyrol only)
- **Webcams** — cameras with a view near the track (broader coverage)

---

## Your Tasks

### Task 1 — Filter the Dataset

Before enriching, reduce the dataset to a manageable subset. Enrichment makes multiple API calls per track — filtering first keeps the number of requests under control and ensures the tracks are geographically compatible with your enrichment data.

The filter script supports narrowing down `spatialdata_all.json` by **source**, by **tags**, or by a **geographic bounding box**.

> **Target size:** aim for roughly **100–500 tracks** in your filtered subset. This keeps enrichment fast enough to complete in one session while giving you enough data to make the visualization and routing in Steps 3 and 4 interesting. If your filtered set is still in the thousands, combine filters (e.g. source + bounding box) to narrow it down further.

> **Questions:**
> - What sources are available? (You discovered these in Step 1.)
> - What tags would give you a specific category of track, e.g. only cycling routes?
> - Does your chosen enrichment data cover the whole world, or only South Tyrol? If only South Tyrol, which bounding box would you use to filter the tracks?
> - Use **[bboxfinder.com](https://bboxfinder.com/)** to draw a bounding box on a map and copy the coordinates.

---

### Task 2 — Find and Download the Enrichment Data

Explore the Open Data Hub API and choose the datasets you want to use for enrichment. The `ODHActivityPoi` endpoint covers a wide range of points of interest, organised by a **tag system**. There is also a dedicated `WebcamInfo` endpoint for webcams.

#### 2a — Discover the Tags

If you want to filter the `ODHActivityPoi` endpoint by category, you first need the exact tag identifier. Use the `Tag` endpoint with a keyword to find it:

```
GET https://tourism.api.opendatahub.com/v1/Tag?searchfilter=<keyword>
```

For example, searching for `eating` or `refill` will give you the tag keys needed to query gastronomies and water refillment points. The tag string must be passed verbatim to the `tagfilter` parameter — it is case-sensitive.

#### 2b — Find Gastronomies

Use the `ODHActivityPoi` endpoint filtered by the tag you found above. In Task 3, the match script will call this endpoint per track with a spatial filter added automatically.

> Each POI record contains a `GpsInfo` array with `Latitude` and `Longitude`.

#### 2c — Find Water Refillment Points

Use the same `ODHActivityPoi` endpoint with the water refillment tag. The match script handles this identically to gastronomies.

#### 2d — Find Webcams

Webcam data comes from a dedicated endpoint:

```
GET https://tourism.api.opendatahub.com/v1/WebcamInfo
```

Webcams also carry a `GpsInfo` position. No tag filter needed — the spatial filter in Task 3 narrows them down per track.

---

### Task 3 — Match POIs to Tracks

Now that you have the track data and the enrichment datasets, you need to **link each track to its nearby POIs and webcams**.

Each SpatialData record has a `Geo.position` field (the center point of the track) and a `Geo.track.Geometry` field (the full WKT geometry of the track — either a `LINESTRING` or a `MULTILINESTRING`). Both can be used as the spatial anchor for matching.

The Content API supports two spatial filters you can use to query nearby POIs:

- **Distance filter** — `latitude`, `longitude`, `radius` (in meters): returns everything within a circle around a point
- **Polygon filter** — `polygon` (WKT): returns everything inside an arbitrary polygon shape

Four matching strategies are possible using these filters — each is a valid solution, with different trade-offs:

**Strategy A — Radius query**: use the track's center point with the distance filter.
> Pitfall: what radius do you choose? Too small and you miss POIs near the ends of the track; too large and you get irrelevant results far away.

**Strategy B — Bounding box**: compute the geographic extent of the full track geometry and pass a rectangular WKT polygon to the polygon filter.
> Pitfall: if the track is not a straight line, the bounding box can become very large and include many POIs that are not actually near the track.

**Strategy C — Simplified polygon**: pass a tighter polygon that follows the actual shape of the track to the polygon filter.
> Pitfall: the polygon is passed as a GET request parameter — watch out for URL length limits if the polygon has too many vertices.

**Strategy D — Sampled points** ⭐ *best results*: sample GPS points at regular metre intervals along the track and fire a small-radius query at each point, deduplicating results by Id. This creates a narrow corridor that closely follows the trail — ideal for long or winding tracks where the other strategies capture too wide an area.
> Pitfall: produces many more API calls than the other strategies — roughly `(track_length / interval) × 3` requests per track. Start with a larger interval (e.g. 1000 m) and reduce if you want finer coverage.

A detailed breakdown of all four strategies, including the expected output format, will be added to `MATCHING.md` together with the solution after the step ends.

#### Output

Produce a single `enriched_tracks.json` file where each track entry lists its matched POIs nearby.

---

## Data Structure Reference

### ODHActivityPoi record (key fields)

| Field | Description |
|---|---|
| `Id` | Unique identifier |
| `Shortname` | Display name |
| `Source` | Data provider |
| `GpsInfo` | Array of GPS positions — use `Latitude` and `Longitude` |
| `TagIds` | List of assigned tags |
| `Detail` | Multilingual title and description |
| `ContactInfos` | Address, phone, website |
| `LicenseInfo` | License details |

```json
{
  "Id": "...",
  "Shortname": "Berggasthof Example",
  "GpsInfo": [
    {
      "Gpstype": "position",
      "Latitude": 46.8,
      "Longitude": 11.4,
      "Altitude": 1200
    }
  ],
  "TagIds": ["eating drinking"],
  "Detail": {
    "de": { "Title": "Berggasthof Example" }
  }
}
```

### WebcamInfo record (key fields)

| Field | Description |
|---|---|
| `Id` | Unique identifier |
| `Webcamname` | Display name of the webcam |
| `GpsInfo` | GPS position (same structure as ODHActivityPoi) |
| `WebcamUrl` | Live image or stream URL |
| `PreviewUrl` | Preview thumbnail URL |
| `LicenseInfo` | License details |

```json
{
  "Id": "...",
  "Webcamname": "Cam Alpenpanorama",
  "GpsInfo": [
    {
      "Latitude": 46.9,
      "Longitude": 11.5
    }
  ],
  "WebcamUrl": "https://...",
  "PreviewUrl": "https://..."
}
```

---

## Tips

- All three POI datasets use the **same pagination pattern** as SpatialData (`TotalPages`, `Items`, `pagenumber`).
- Use a high `pagesize` (e.g. `100`) to minimise request count.
- The `tagfilter` parameter is **case-sensitive** — use the exact tag string from the Tag endpoint.
- Webcams are relatively few in number; a single page may be enough.
- Start with a small filtered subset (Task 1) before running enrichment on the full dataset.
