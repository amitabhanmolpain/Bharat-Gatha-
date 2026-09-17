"""Chunking Service for Bharat Gatha RAG Pipeline.

Splits markdown knowledge base files strictly by '##' headers, ensuring
each section becomes ONE chunk retaining rich region and location metadata.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any


def resolve_region_from_filename(filename: str) -> str:
    """Derive standardized region key from knowledge base filename."""
    lower_name = filename.lower()
    if "mughal" in lower_name:
        return "mughal"
    elif "rajputana" in lower_name or "rajasthan" in lower_name:
        return "rajputana"
    elif "vijayanagara" in lower_name or "hampi" in lower_name:
        return "vijayanagara"
    return "general"


def chunk_markdown_by_headers(filepath: str) -> List[Dict[str, Any]]:
    """Split a markdown knowledge base file by '##' headers into discrete chunks.

    Args:
        filepath (str): Absolute or relative path to the .md file.

    Returns:
        List[Dict[str, Any]]: List of chunks with keys:
            - id: Unique identifier
            - text: Clean chunk content (header + body)
            - metadata: { 'region': str, 'location': str, 'source_file': str }
    """
    path_obj = Path(filepath)
    if not path_obj.exists():
        raise FileNotFoundError(f"Knowledge base file not found at: {filepath}")

    with open(path_obj, "r", encoding="utf-8") as f:
        content = f.read()

    filename = path_obj.name
    region = resolve_region_from_filename(filename)

    # Regex to split by ## headers while preserving the header title
    header_pattern = re.compile(r"^##\s+(.+)$", re.MULTILINE)
    matches = list(header_pattern.finditer(content))

    chunks: List[Dict[str, Any]] = []

    for idx, match in enumerate(matches):
        header_text = match.group(1).strip()
        start_pos = match.start()
        end_pos = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)

        raw_section = content[start_pos:end_pos].strip()
        # Remove markdown horizontal rules (---) if present at end of chunk
        cleaned_section = re.sub(r"\n---\s*$", "", raw_section).strip()

        location_parsed = header_text
        if "—" in header_text:
            location_parsed = header_text.split("—")[0].strip()
        elif "-" in header_text:
            location_parsed = header_text.split("-")[0].strip()

        clean_loc_slug = re.sub(r"[^a-zA-Z0-9_]", "", location_parsed.lower())[:24]
        chunk_id = f"{region}_{idx}_{clean_loc_slug}"

        chunks.append({
            "id": chunk_id,
            "text": cleaned_section,
            "metadata": {
                "region": region,
                "location": location_parsed,
                "header": header_text,
                "source_file": filename
            }
        })

    return chunks
