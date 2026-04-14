# Solution — Step 1: Get the Data

## API Reference

The **Content API wiki** documents all endpoints, the `Distinct` query syntax, and available filters:
**[github.com/noi-techpark/opendatahub-docs/wiki/Content-API](https://github.com/noi-techpark/opendatahub-docs/wiki/Content-API)**

The interactive Swagger UI is available at:
**[tourism.api.opendatahub.com/swagger/index.html](https://tourism.api.opendatahub.com/swagger/index.html)**

---

## Task 1 — Explore the Endpoint and Discover Sources & Tags

### 1a — Understanding the SpatialData Endpoint

The SpatialData endpoint is available at:

```
GET https://tourism.api.opendatahub.com/v1/SpatialData
```

Key query parameters:

| Parameter | Description |
|-----------|-------------|
| `source` | Filter by source name |
| `type` | Filter by track type |
| `pagesize` | Number of results per page (default: 10) |
| `pagenumber` | Page to retrieve |
| `fields` | Comma-separated list of fields to include in the response |
| `searchfilter` | Free-text search |

### 1b — Discover the Sources and Tags

#### Sources

```
GET https://tourism.api.opendatahub.com/v1/Distinct?type=spatialdata&fields=Source
```

Returns all unique `Source` values across SpatialData. Each entry is a different data provider. The `type=spatialdata` parameter tells the Distinct endpoint which dataset to query.

#### Tags

```
GET https://tourism.api.opendatahub.com/v1/Distinct?type=spatialdata&fields=TagIds.[*]
```

The `TagIds.[*]` syntax expands the array so each tag is returned as a distinct value. The result is the full list of tags used across all SpatialData records.

Use these values with `--tags` in Step 2 (`filter_tracks.py` / `filterTracks.js`) to reduce the dataset to a specific track type before enrichment — e.g. `--tags cycling` or `--tags "biking biking tours"`.

---

## Task 2 — Fetch and Save All Data Locally

### 2a — Fetch Data Programmatically

#### Approach

1. Send a `GET` request to `v1/SpatialData`
2. The response is a paginated object — the actual records are in the `Items` array
3. For each item, read:
   - `Id`
   - `Source`
   - `_Meta.Type`
   - Title: iterate over `Detail` keys (language codes) and take the first `Title` found

#### Response structure

```json
{
  "TotalResults": 12345,
  "TotalPages": 1235,
  "CurrentPage": 1,
  "OnlineResults": -1,
  "ResultId": "...",
  "Seed": "...",
  "Items": [ ... ]
}
```

The records you need are inside `Items`.

#### Python example

```bash
cd python
pip install requests
python fetch_spatial_data.py
```

See [python/fetch_spatial_data.py](./python/fetch_spatial_data.py) for the full implementation.

#### JavaScript example

The script uses native `fetch` (Node 18+) and ES modules. Run it directly:

```bash
cd node
node fetchSpatialData.js
```

See [node/fetchSpatialData.js](./node/fetchSpatialData.js) for the full implementation.

---

### 2b — Download All Data and Save Locally

#### Approach

The pagination metadata in every response gives you everything you need:

```
TotalPages  → how many pages exist in total
CurrentPage → which page you just received
NextPage    → ready-made URL for the next page (null on the last page)
Items       → the records on this page
```

Two valid strategies:

**Option A — follow `NextPage`**
Keep requesting `NextPage` until it is `null`. No need to track page numbers manually.

**Option B — loop by page number**
Read `TotalPages` from the first response, then loop `for page in range(1, total_pages + 1)`.

Use a large `pagesize` (e.g. `100`) to minimise the number of HTTP requests.

#### Result

All `Items` arrays from every page are concatenated into a single flat list and written to `spatialdata_all.json`:

```json
[
  { "Id": "...", "Source": "...", ... },
  { "Id": "...", "Source": "...", ... },
  ...
]
```

#### Python example

```bash
cd python
pip install requests
python fetch_spatial_data.py
```

Calls `download_all_spatial_data()` and writes `spatialdata_all.json` to `data/` at the repo root. See [python/fetch_spatial_data.py](./python/fetch_spatial_data.py).

#### JavaScript example

```bash
cd node
node fetchSpatialData.js
```

Calls `downloadAllSpatialData()` and writes `spatialdata_all.json` to `data/` at the repo root. Requires Node 18+. See [node/fetchSpatialData.js](./node/fetchSpatialData.js).
