import { writeFileSync, mkdirSync } from "fs";

const DATA_DIR = "../../data";
mkdirSync(DATA_DIR, { recursive: true });

const BASE_URL = "https://tourism.api.opendatahub.com/v1";
const PAGE_SIZE = 100;

async function getDistinctSources() {
  const url = new URL(`${BASE_URL}/Distinct`);
  url.searchParams.set("type", "spatialdata");
  url.searchParams.set("fields", "Source");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getSpatialDataPage({ page = 1, pagesize = PAGE_SIZE, source } = {}) {
  const url = new URL(`${BASE_URL}/SpatialData`);
  url.searchParams.set("pagenumber", page);
  url.searchParams.set("pagesize", pagesize);
  if (source) url.searchParams.set("source", source);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Download every page of SpatialData and merge all records into one JSON file.
 *
 * Strategy: read TotalPages from the first response, then loop through all pages
 * collecting Items into a single array.
 */
async function downloadAllSpatialData({ source, outputFile = `${DATA_DIR}/spatialdata_all.json` } = {}) {
  console.log("Fetching page 1 ...");
  const firstPage = await getSpatialDataPage({ page: 1, source });

  const totalPages = firstPage.TotalPages;
  const totalResults = firstPage.TotalResults;
  console.log(`  Total results: ${totalResults}  |  Total pages: ${totalPages}`);

  const allItems = [...firstPage.Items];

  for (let page = 2; page <= totalPages; page++) {
    console.log(`Fetching page ${page}/${totalPages} ...`);
    const data = await getSpatialDataPage({ page, source });
    allItems.push(...data.Items);
  }

  console.log(`\nDownloaded ${allItems.length} records total.`);
  writeFileSync(outputFile, JSON.stringify(allItems, null, 2), "utf-8");
  console.log(`Saved to ${outputFile}`);

  return allItems;
}

function getTitle(detail = {}) {
  for (const langData of Object.values(detail)) {
    if (langData?.Title) return langData.Title;
  }
  return "(no title)";
}

async function main() {
  // --- Task 1: Discover sources ---
  console.log("=== Distinct Sources ===");
  const distinct = await getDistinctSources();
  console.log(distinct);
  console.log();

  // --- Task 3: Inspect a single page ---
  console.log("=== SpatialData Records (page 1, 5 items) ===");
  const data = await getSpatialDataPage({ page: 1, pagesize: 5 });
  console.log(`Total results: ${data.TotalResults}`);
  console.log(`Total pages:   ${data.TotalPages}`);
  console.log();

  for (const item of data.Items) {
    console.log(`  Id:     ${item.Id}`);
    console.log(`  Source: ${item.Source}`);
    console.log(`  Type:   ${item._Meta?.Type}`);
    console.log(`  Title:  ${getTitle(item.Detail)}`);
    console.log();
  }

  // --- Task 4: Download everything ---
  console.log("=== Downloading all SpatialData ===");
  await downloadAllSpatialData();
}

main().catch(console.error);
