#!/usr/bin/env python3
"""Generic CSV -> JSON converter for the website catalog.

Each assets/data/*.csv becomes a JSON array of row objects that keeps the
ORIGINAL column names (exactly like a normal excel/csv-to-json converter).
Column-name matching is NOT done here - it lives on the code side in
assets/js/catalog.js. So the client can add, remove or rename spreadsheet
columns without ever touching this script.

FileName -> json name mapping (deployment naming, unrelated to columns) is
kept here so "Impurities.csv" still lands as "impurities.json".

The matching *-data.js fallback files are regenerated from the same data.

Safety: every CSV is parsed before anything is written. If any CSV is
unreadable/unparseable the script writes nothing and exits non-zero, so the
previously deployed site stays live.
"""
import csv
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "data")

# CSV base name (lowercase) -> output json file name. This is about file
# naming only; it does not touch column names.
OUTPUT_NAMES = {
    "impurities": "impurities.json",
    "api": "api.json",
    "apis": "api.json",
    "intermediates": "intermediates.json",
    "intermediate": "intermediates.json",
    "ksm": "intermediates.json",
}

# output json file name -> global variable used by the embedded fallback .js file
JS_VAR = {
    "impurities.json": "VQ_IMPURITIES",
    "api.json": "VQ_API",
    "intermediates.json": "VQ_INTERMEDIATES",
}


class ConversionError(Exception):
    pass


def read_text(path):
    """Decode a CSV that may be UTF-8, Windows-1252 or Latin-1."""
    with open(path, "rb") as fh:
        raw = fh.read()
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def output_name(csv_name):
    """Map a CSV file name to the JSON file the website expects.

    Exact known names win; otherwise infer from keywords so a non-technical
    user can drop in a loosely named file (e.g. "Impurities list.csv").
    """
    base = os.path.splitext(os.path.basename(csv_name))[0]
    key = re.sub(r"\s+", " ", base).strip().lower()

    if key in OUTPUT_NAMES:
        return OUTPUT_NAMES[key]

    if "impurit" in key:
        return "impurities.json"
    if "intermed" in key or "ksm" in key:
        return "intermediates.json"
    if re.search(r"\bapis?\b", key):
        return "api.json"

    return key + ".json"


def parse_csv(csv_path):
    """Parse a CSV into a list of row dicts, keeping the original headers."""
    try:
        reader = csv.DictReader(io.StringIO(read_text(csv_path)))
        fieldnames = reader.fieldnames
        if not fieldnames or not any(str(name).strip() for name in fieldnames):
            raise ConversionError("file has no header row")

        rows = []
        for raw in reader:
            row = {}
            for key, value in raw.items():
                if key is None:
                    continue
                row[key] = "" if value is None else str(value).strip()
            if any(str(value).strip() for value in row.values()):
                rows.append(row)
    except csv.Error as exc:
        raise ConversionError("malformed CSV: %s" % exc)

    if not rows:
        raise ConversionError("no data rows found")
    return rows


def atomic_write(path, text):
    """Write via a temp file + replace so a crash can never leave a partial file."""
    tmp_path = path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    os.replace(tmp_path, path)


def write_json(json_path, rows):
    atomic_write(json_path, json.dumps(rows, ensure_ascii=False, indent=2) + "\n")


def data_js_name(json_name):
    return os.path.splitext(json_name)[0] + "-data.js"


def write_data_js(js_path, var_name, rows):
    payload = json.dumps(rows, ensure_ascii=False, indent=2)
    atomic_write(js_path, "window.%s = %s;\n" % (var_name, payload))


def main():
    if not os.path.isdir(DATA_DIR):
        print("Data directory not found: %s" % DATA_DIR, file=sys.stderr)
        return 1

    csv_files = sorted(f for f in os.listdir(DATA_DIR) if f.lower().endswith(".csv"))
    if not csv_files:
        print("No CSV files found in %s" % DATA_DIR)
        return 0

    # Phase 1: parse everything, write nothing yet.
    pending = []
    errors = []
    for name in csv_files:
        csv_path = os.path.join(DATA_DIR, name)
        json_name = output_name(name)
        json_path = os.path.join(DATA_DIR, json_name)
        try:
            pending.append((name, json_name, json_path, parse_csv(csv_path)))
        except Exception as exc:
            errors.append((name, str(exc)))

    if errors:
        for name, err in errors:
            message = "%s: %s" % (name, err)
            print("ERROR: " + message, file=sys.stderr)
            # Surface the reason as an annotation in the GitHub Actions UI.
            print("::error title=CSV conversion failed::" + message)
        print(
            "Aborted: no JSON files were modified. Previous catalog data is intact.",
            file=sys.stderr,
        )
        return 1

    # Phase 2: all inputs are readable, write the JSON files and their .js fallbacks.
    for name, json_name, json_path, rows in pending:
        write_json(json_path, rows)
        outputs = json_name
        var_name = JS_VAR.get(json_name)
        if var_name:
            js_name = data_js_name(json_name)
            write_data_js(os.path.join(DATA_DIR, js_name), var_name, rows)
            outputs += ", " + js_name
        print("%s -> %s (%d rows)" % (name, outputs, len(rows)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
