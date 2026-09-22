#!/usr/bin/env python3
"""Convert catalog CSV files in assets/data to JSON for the website.

CSV is the editable source of truth; JSON is what the browser loads.
The matching *-data.js fallback files are regenerated from the same data,
so the offline/last-good fallback never goes stale.

Safety rules:
  * Every CSV is parsed and validated BEFORE anything is written.
  * If any CSV is malformed, the script writes nothing and exits non-zero,
    so the previously committed JSON stays intact and the site keeps working.
  * A valid CSV must have recognizable catalog columns, at least one data row,
    and a non-empty "Product Name" and "CAS Number" column.

Run locally with:  python scripts/csv_to_json.py
"""
import csv
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "data")

HEADER_ALIASES = {
    "PRODUCT ID": "Product ID",
    "PRODUCT NAME": "Product Name",
    "COMMON NAME": "Product Name",
    "COMPOUND NAME": "Product Name",
    "CHEMICAL NAME": "Chemical Name",
    "IUPAC NAME": "Chemical Name",
    "SYNONYM": "Synonym",
    "SYNONYMS": "Synonym",
    "CAS NO": "CAS Number",
    "CAS NUMBER": "CAS Number",
    "CAS": "CAS Number",
    "MOLECULAR FORMULA": "Molecular Formula",
    "CHEMICAL FORMULA": "Molecular Formula",
    "FORMULA": "Molecular Formula",
    "MOLECULAR WEIGHT": "Molecular Weight",
    "MOL WEIGHT": "Molecular Weight",
    "PURITY": "Purity",
    "PURITY STANDARD": "Purity",
    "PACKAGING SIZE": "Packaging Size",
    "PACKAGE SIZE": "Packaging Size",
    "GRADE": "Grade",
    "GRADE STANDARD": "Grade",
    "FORM": "Form",
    "PACKAGING TYPE": "Packaging Type",
    "USAGE": "Usage",
    "USAGE/ APPLICATION": "Usage",
    "APPLICATION": "Usage",
    "MINIMUM ORDER QUANTITY": "MOQ",
    "MOQ": "MOQ",
    "DELIVERY TIME": "Availability",
    "AVAILABILITY": "Availability",
    "LEAD TIME": "Availability",
    "API FAMILY": "API Family",
    "FAMILY": "API Family",
}

# CSV base name (lowercase) -> output json file name
OUTPUT_NAMES = {
    "impurities": "impurities.json",
    "api": "api.json",
    "apis": "api.json",
    "intermediates": "intermediates.json",
    "intermediate": "intermediates.json",
    "ksm": "intermediates.json",
}

# output json file name -> generated Product ID prefix
ID_PREFIX = {
    "impurities.json": "VQ-IMP",
    "api.json": "VQ-API",
    "intermediates.json": "VQ-INT",
}

# output json file name -> global variable used by the embedded fallback .js file
JS_VAR = {
    "impurities.json": "VQ_IMPURITIES",
    "api.json": "VQ_API",
    "intermediates.json": "VQ_INTERMEDIATES",
}

CANONICAL_NAMES = set(HEADER_ALIASES.values())
REQUIRED_FIELDS = ("Product Name", "CAS Number")


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


def clean(value):
    if value is None:
        return ""
    return str(value).replace("\u2019", "'").replace("\u2018", "'").strip()


def normalize_header(name):
    return re.sub(r"\s+", " ", str(name)).strip().upper()


def canonical_header(name):
    return HEADER_ALIASES.get(normalize_header(name), str(name).strip())


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
    """Parse a CSV into a list of canonical-keyed rows. Raises on malformed input."""
    try:
        reader = csv.DictReader(io.StringIO(read_text(csv_path)))
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise ConversionError("file has no header row")

        rows = []
        for raw in reader:
            row = {}
            for key, value in raw.items():
                if key is None:
                    continue
                row[canonical_header(key)] = clean(value)
            if any(str(value).strip() for value in row.values()):
                rows.append(row)
    except csv.Error as exc:
        raise ConversionError("malformed CSV: %s" % exc)

    validate(rows, fieldnames)
    return rows


def validate(rows, fieldnames):
    recognized = [canonical_header(name) for name in fieldnames]
    if not any(name in CANONICAL_NAMES for name in recognized):
        raise ConversionError(
            "no recognizable catalog columns in header: %s"
            % ", ".join(str(name) for name in fieldnames)
        )
    if not rows:
        raise ConversionError("no data rows found")
    for field in REQUIRED_FIELDS:
        if not any(row.get(field) for row in rows):
            raise ConversionError(
                "column '%s' is missing or empty for every row" % field
            )


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

    # Phase 1: parse and validate everything, write nothing yet.
    pending = []
    errors = []
    for name in csv_files:
        csv_path = os.path.join(DATA_DIR, name)
        json_name = output_name(name)
        json_path = os.path.join(DATA_DIR, json_name)
        try:
            rows = parse_csv(csv_path)
            prefix = ID_PREFIX.get(json_name)
            if prefix:
                for idx, row in enumerate(rows, start=1):
                    if not row.get("Product ID"):
                        row["Product ID"] = "%s-%03d" % (prefix, idx)
            pending.append((name, json_name, json_path, rows))
        except Exception as exc:
            errors.append((name, str(exc)))

    if errors:
        for name, err in errors:
            print("ERROR: %s: %s" % (name, err), file=sys.stderr)
        print(
            "Aborted: no JSON files were modified. Previous catalog data is intact.",
            file=sys.stderr,
        )
        return 1

    # Phase 2: all inputs are valid, write the JSON files and their .js fallbacks.
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
