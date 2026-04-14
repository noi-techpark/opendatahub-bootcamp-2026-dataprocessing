# Step 3 — Visualize the Data

## Goal

Build an interactive map that visualizes:
- All SpatialData **tracks**
- The **filtered tracks** (the subset you worked with in Step 2)
- The **matched enrichment data** per track — with name and any available extra info (e.g. a link to the webcam stream)

The choice of tool is yours — [Leaflet.js](https://leafletjs.com/) is a good starting point for a browser-based map, but feel free to use any library or framework you prefer (Maplibre, Deck.gl, Folium, QGIS, etc.).

---

## Prerequisites

You need the output files from the previous steps:

| File | Produced by |
|---|---|
| `data/spatialdata_all.json` | Step 1 — all track geometries |
| `data/filtered_tracks.json` | Step 2 — the filtered subset |
| `data/enriched_tracks.json` | Step 2 — matched POIs per track |

---

## Your Tasks

### Task 1 — Render the Tracks

Display all tracks (or the filtered subset) on a map. Each track has a `Geo.track.Geometry` field containing a WKT `MULTILINESTRING` with the GPS coordinates.

> **Think about:** How do you parse a WKT MULTILINESTRING into coordinates your map library understands?

### Task 2 — Display the Matched Enrichment Data

For each track in `enriched_tracks.json`, display the matched data as markers or icons on the map.

When a user interacts with a marker, show the name and any other relevant information available in the record — the structure depends on which datasets you matched in Step 2.

> **Think about:** How do you visually distinguish the different types of matched data? How do you surface the most useful information for each type?

---

## Tips

- Tracks are encoded as WKT (`MULTILINESTRING ((lon lat, lon lat, ...))`). You will need to parse the coordinate pairs out of the string — WKT uses **longitude first, latitude second**, which is the reverse of most map libraries.
- `enriched_tracks.json` is keyed by track ID — each entry contains the track position and its matched data arrays.
- Start simple: get the tracks on a map first, then layer the matched data on top.
