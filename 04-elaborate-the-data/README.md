# Step 4 — Elaborate the Data

## Challenge — Simple Routing

Write a function:

```
findRoute(spatialData, startLat, startLon, endLat, endLon)
```

Given a start GPS point and an end GPS point, return the list of track IDs you need to follow to get from A to B.

### Goal

This is a **simple routing mechanism**, not a full navigation engine. The goal is to find a practical sequence of tracks that connects the two points — not a perfect turn-by-turn route.

### Rules

- Each track has **endpoints** — the first and last coordinate of each line in its geometry
- Two tracks are **connected** if any of their endpoints are within a threshold distance of each other (default: 500 m)
- **Real connections are always preferred** — use tracks that physically meet or nearly meet
- **Air gaps are allowed as a last resort** — if part of the network is truly disconnected, a straight-line jump between the closest tracks of two clusters is valid; the output is a list of track IDs, not turn-by-turn navigation
- **Minimise air gaps** — a good result has few or no air hops; many air hops means the route is going through disconnected clusters and the threshold may need to be increased

### Approach

Think about how to model this as a graph problem:

- How do you decide whether two tracks are **connected**?
- How do you handle tracks that are **not connected** to anything nearby — do you allow a jump, and if so, how do you make sure it is only used as a last resort?
- How do you **snap** an arbitrary GPS coordinate to the nearest track?
- What should the **edge weight** represent so that the shortest path is also the most geographically sensible one?

There is no single correct solution — a simple brute-force approach already gets you far.

### Output

```json
{
  "found": true,
  "tracks": ["urn:...:route.123", "urn:...:route.456"],
  "length_m": 18420,
  "air_hops": 0
}
```

`air_hops: 0` means a fully connected route was found through real tracks.  
`air_hops > 0` means the route had to jump across a disconnected gap — try increasing `--threshold`.

---

## Dependencies

**Python** — requires `networkx`:

```bash
pip install networkx
```

**JavaScript** — no extra packages needed (Node 18+ built-ins only).

---

## Source Code

- Python: [python/find_route.py](./python/find_route.py)
- JavaScript: [node/findRoute.js](./node/findRoute.js)
