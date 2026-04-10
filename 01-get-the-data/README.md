# Step 1 — Get the Data

## Context

The [Open Data Hub](https://opendatahub.com) is a platform that aggregates and exposes open data from South Tyrol and the surrounding alpine region. In this challenge you will work with **SpatialData** — geographic track data (cycling routes, hiking trails, etc.) collected from various sources.

### Useful links

| Resource | URL |
|---|---|
| Open Data Hub Discovery | [discovery.opendatahub.com/discovery](https://discovery.opendatahub.com/discovery) |
| Data Browser | [databrowser.opendatahub.com](https://databrowser.opendatahub.com/) |
| Content API Swagger UI | [tourism.api.opendatahub.com/swagger/index.html](https://tourism.api.opendatahub.com/swagger/index.html) |
| Content API Docs Wiki | [github.com/noi-techpark/opendatahub-docs/wiki/Content-API](https://github.com/noi-techpark/opendatahub-docs/wiki/Content-API) |

The Docs Wiki explains all endpoints, filters, and the `Distinct` query used in Task 1 below. The Swagger UI lets you explore and call the API interactively — look for the `SpatialData` and `Distinct` sections.

---

## Your Tasks

### Task 1 — Explore the Endpoint and Discover Sources & Tags

#### 1a — Explore the SpatialData Endpoint

Browse and understand the structure of the SpatialData endpoint using the Swagger UI or by calling it directly:

```
GET https://tourism.api.opendatahub.com/v1/SpatialData
```

Get familiar with the response shape, pagination fields, and available query parameters before writing code.

#### 1b — Discover the Sources and Tags

Before fetching data, understand **where it comes from** and **how it is categorised**.

The API exposes a `Distinct` endpoint that returns all unique values of any field across a dataset. Use it to find:

1. All distinct **Sources** in SpatialData
2. All distinct **TagIds** used across SpatialData tracks

> **Questions:**
> - How many distinct sources are there, and what are they?
> - What tags exist? Note them down — you will use `--tags` in Step 2 to filter to a specific track type before enriching.

> **Hint:** Check the `v1/Distinct` endpoint in the API wiki or Swagger UI. The `fields` parameter accepts dot-notation to expand nested or array fields.

---

### Task 2 — Fetch and Save All Data Locally

#### 2a — Fetch Data Programmatically

Write a script (in the language of your choice) that:

1. Calls the `v1/SpatialData` endpoint
2. Retrieves a list of records
3. Prints the `Id`, `Source`, `_Meta.Type`, and the title from `Detail` (in any available language) for each record

#### 2b — Download All Data and Save Locally

The API returns paginated results. A single response looks like this:

```json
{
  "TotalResults": 1085,
  "TotalPages": 109,
  "CurrentPage": 1,
  "PreviousPage": null,
  "NextPage": "https://tourism.api.opendatahub.com/v1/SpatialData?pagenumber=2",
  "Seed": null,
  "Items": [ {}, {} ]
}
```

Extend your script to:

1. Fetch the first page and read `TotalPages`
2. Iterate through **all** pages (following `NextPage` or incrementing `pagenumber`)
3. Collect every item from every page into a single list
4. Save the merged result as a local JSON file

> **Goal:** a single `spatialdata_all.json` file containing all records as a flat array.

---

## Data Structure Reference

A SpatialData record has the following key fields:

| Field | Description |
|-------|-------------|
| `Id` | Unique URN identifier of the record |
| `_Meta.Type` | Always `spatialdata` for this endpoint |
| `_Meta.Source` | The data provider (e.g. `civis.geoserver`) |
| `_Meta.LastUpdate` | Timestamp of the last update |
| `Source` | Same as `_Meta.Source` — the origin system |
| `Shortname` | Short display name of the track |
| `Detail` | Multilingual object containing `Title` and `BaseText` per language code |
| `Geo` | Geographic data — contains `track` (MULTILINESTRING geometry) and `position` (lat/lon point) |
| `TagIds` | Array of tag strings associated with the record |
| `Mapping` | Raw fields as they came from the source system |
| `LicenseInfo` | License details (author, license type, closed data flag) |
| `Active` | Whether the record is currently active |
| `HasLanguage` | List of language codes for which `Detail` content exists |

### Geo Field Detail

```
Geo
├── track
│   ├── Geometry   → WKT MULTILINESTRING with all GPS coordinates
│   ├── Default    → true if this is the primary geometry
│   └── Gpstype    → type identifier
└── position
    ├── Latitude   → starting point latitude
    ├── Longitude  → starting point longitude
    └── Gpstype    → "position"
```

### Example Record (abbreviated)

```json
{
  "Id": "urn:civis.geoserver:cyclewaystyrol:routes-cycleways-tyrol.20327",
  "Shortname": "Bettelwurf Line",
  "Source": "civis.geoserver",
  "_Meta": {
    "Type": "spatialdata",
    "Source": "civis.geoserver",
    "LastUpdate": "2026-04-09T13:59:45Z"
  },
  "Detail": {
    "de": {
      "Title": "Bettelwurf Line",
      "BaseText": "Die blaue Bettelwurf Line im Bikepark ...",
      "Language": "de"
    }
  },
  "Geo": {
    "track": {
      "Default": true,
      "Geometry": "MULTILINESTRING ((11.538 47.313, ...))"
    },
    "position": {
      "Latitude": 47.31311677,
      "Longitude": 11.53844541
    }
  },
  "TagIds": ["cyclewaystyrol", "cycling", "biking biking tours"],
  "LicenseInfo": {
    "License": "CC0",
    "ClosedData": false
  }
}
```

---

## Tips

- The API is **open** — no authentication needed for read access.
- Use the `pagesize` and `pagenumber` query parameters to paginate through results. Use a high `pagesize` (e.g. `100`) to reduce the number of requests needed.
- The `fields` query parameter lets you request only specific fields to reduce response size.
- All data is licensed as **CC0** (public domain) unless `LicenseInfo.ClosedData` is `true`.
- `TotalPages` tells you upfront how many pages to expect — use it to drive your loop.
- `NextPage` in the response contains the ready-made URL for the next page, so you can follow it directly instead of building URLs manually.
