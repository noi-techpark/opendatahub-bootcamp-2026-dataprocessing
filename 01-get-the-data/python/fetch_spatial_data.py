import json
import os
import requests

BASE_URL = "https://tourism.api.opendatahub.com/v1"
PAGE_SIZE = 100
DATA_DIR = "../../data"

os.makedirs(DATA_DIR, exist_ok=True)


def get_distinct_sources():
    """Fetch all distinct Source values in the SpatialData dataset."""
    response = requests.get(
        f"{BASE_URL}/Distinct",
        params={"type": "spatialdata", "fields": "Source"},
    )
    response.raise_for_status()
    return response.json()


def get_spatial_data_page(page=1, pagesize=PAGE_SIZE, source=None):
    """Fetch a single page of SpatialData records."""
    params = {"pagenumber": page, "pagesize": pagesize}
    if source:
        params["source"] = source

    response = requests.get(f"{BASE_URL}/SpatialData", params=params)
    response.raise_for_status()
    return response.json()


def download_all_spatial_data(source=None, output_file="spatialdata_all.json"):
    """
    Download every page of SpatialData and merge all records into one JSON file.

    Strategy: read TotalPages from the first response, then loop through all pages
    collecting Items into a single list.
    """
    print("Fetching page 1 ...")
    first_page = get_spatial_data_page(page=1, source=source)

    total_pages = first_page["TotalPages"]
    total_results = first_page["TotalResults"]
    print(f"  Total results: {total_results}  |  Total pages: {total_pages}")

    all_items = list(first_page["Items"])

    for page in range(2, total_pages + 1):
        print(f"Fetching page {page}/{total_pages} ...")
        data = get_spatial_data_page(page=page, source=source)
        all_items.extend(data["Items"])

    print(f"\nDownloaded {len(all_items)} records total.")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"Saved to {output_file}")
    return all_items


def get_title(detail: dict) -> str:
    """Extract the first available title from the Detail multilingual object."""
    for lang_data in detail.values():
        title = lang_data.get("Title")
        if title:
            return title
    return "(no title)"


def main():
    # --- Task 1: Discover sources ---
    print("=== Distinct Sources ===")
    distinct = get_distinct_sources()
    print(distinct)
    print()

    # --- Task 3: Inspect a single page ---
    print("=== SpatialData Records (page 1, 5 items) ===")
    data = get_spatial_data_page(page=1, pagesize=5)
    print(f"Total results: {data['TotalResults']}")
    print(f"Total pages:   {data['TotalPages']}")
    print()

    for item in data["Items"]:
        print(f"  Id:     {item.get('Id', '')}")
        print(f"  Source: {item.get('Source', '')}")
        print(f"  Type:   {item.get('_Meta', {}).get('Type', '')}")
        print(f"  Title:  {get_title(item.get('Detail', {}))}")
        print()

    # --- Task 4: Download everything ---
    print("=== Downloading all SpatialData ===")
    download_all_spatial_data(output_file=f"{DATA_DIR}/spatialdata_all.json")


if __name__ == "__main__":
    main()
