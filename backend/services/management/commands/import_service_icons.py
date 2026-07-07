import hashlib
import re
import traceback
from dataclasses import dataclass
from typing import Dict, Optional
from urllib.request import Request, urlopen

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from services.models import Service


@dataclass(frozen=True)
class ImportResult:
    name: str
    status: str  # Imported|Skipped|Failed
    detail: str = ""


LUCIDE_CDN_BASE = "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/"

# Deterministic mapping: service title -> Lucide icon slug.
# Keys are stored in canonical form; lookup is normalised at runtime.
SERVICE_ICON_MAPPING: Dict[str, str] = {
    "AI Integration & Automation": "bot",
    "Brand Identity & Graphic Design": "palette",
    "Cloud Deployment & DevOps": "cloud-cog",
    "Custom Business Systems": "blocks",
    "Cybersecurity Consulting": "shield-check",
    "Database Design & Engineering": "database",
    "Full-Stack Web Development": "code-xml",
    "IoT & Smart Systems": "cpu",
    "Mobile Application Development": "smartphone",
    "Network Infrastructure Solutions": "network",
    "Technical Consulting & Training": "presentation",
    "UI/UX & Product Design": "pencil-ruler",
}

# Fallback icon slugs for specific cases where the primary icon might fail.
FALLBACK_MAPPING: Dict[str, str] = {
    "Cloud Deployment & DevOps": "cloud",
    "Technical Consulting & Training": "graduation-cap",
}


def normalise_key(text: str) -> str:
    """Normalise a title for fuzzy dictionary lookup.

    - strip leading/trailing whitespace
    - lowercase
    - collapse multiple spaces into one
    """
    return re.sub(r" +", " ", text.strip().lower())


def build_normalised_mapping(raw: Dict[str, str]) -> Dict[str, str]:
    """Build a normalised-key lookup from a raw mapping dict."""
    return {normalise_key(k): v for k, v in raw.items()}


# Pre-built normalised lookups.
_NORMALISED_ICON_MAPPING = build_normalised_mapping(SERVICE_ICON_MAPPING)
_NORMALISED_FALLBACK_MAPPING = build_normalised_mapping(FALLBACK_MAPPING)


def is_svg_bytes(data: bytes) -> bool:
    head = data.strip()[:200].lower()
    return head.startswith(b"<svg") or b"<svg" in head


def fetch_lucide_icon(slug: str) -> Optional[bytes]:
    """Fetch an SVG icon from the Lucide CDN."""
    url = f"{LUCIDE_CDN_BASE}{slug}.svg"
    req = Request(url, headers={"User-Agent": "SemperLightsIconImporter/1.0"})
    try:
        with urlopen(req, timeout=25) as resp:
            data = resp.read()
            if not is_svg_bytes(data):
                return None
            return data
    except Exception:
        return None


def ensure_svg_visible_on_dark(svg_bytes: bytes) -> bytes:
    """Wrap SVG with a subtle neutral rounded background.

    Matches the same approach used by the Technology icon importer
    to ensure visibility on both dark and light themes.
    """
    text = svg_bytes.decode("utf-8", errors="ignore")

    viewbox_match = re.search(r'viewBox\s*=\s*"([^"]+)"', text, flags=re.IGNORECASE)
    if viewbox_match:
        vb = viewbox_match.group(1)
    else:
        vb = "0 0 512 512"

    if "<svg" in text.lower():
        stripped = re.sub(r"^\s*<svg[^>]*>", "", text, flags=re.IGNORECASE | re.DOTALL)
        stripped = re.sub(r"</svg>\s*$", "", stripped, flags=re.IGNORECASE | re.DOTALL)
        wrapper = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">
  <rect x="0" y="0" width="100%" height="100%" rx="96" ry="96" fill="rgba(148,163,184,0.18)" />
  {stripped}
</svg>
"""
    else:
        wrapper = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">
  <rect x="0" y="0" width="100%" height="100%" rx="96" ry="96" fill="rgba(148,163,184,0.18)" />
  <g>
    {text}
  </g>
</svg>
"""

    return wrapper.encode("utf-8")


def filename_for_icon(name: str, content: bytes) -> str:
    h = hashlib.sha256(content).hexdigest()[:16]
    safe = re.sub(r"[^a-zA-Z0-9_-]+", "_", name).strip("_")[:60]
    return f"{safe}_{h}.svg"


class Command(BaseCommand):
    help = "Import Lucide SVG icons into Service.icon"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite existing Service.icon fields.",
        )

    def handle(self, *args, **options):
        force: bool = bool(options.get("force"))

        results: Dict[str, ImportResult] = {}

        services = list(Service.objects.all().only("id", "title", "icon"))
        if not services:
            self.stdout.write(self.style.WARNING("No Service records found."))
            return

        self.stdout.write(f"Found {len(services)} Service records. Starting import...")

        imported = 0
        skipped = 0
        failed = 0

        for service in services:
            name = service.title
            try:
                if service.icon and not force:
                    skipped += 1
                    results[name] = ImportResult(
                        name=name, status="Skipped", detail="icon already set"
                    )
                    continue

                # Determine icon slug from normalised mapping.
                key = normalise_key(name)
                slug = _NORMALISED_ICON_MAPPING.get(key)
                if not slug:
                    failed += 1
                    results[name] = ImportResult(
                        name=name,
                        status="Failed",
                        detail=f"no icon mapping for '{name}'",
                    )
                    self.stderr.write(f"[FAILED] {name}: no icon mapping")
                    continue

                svg = fetch_lucide_icon(slug)
                if svg is None:
                    # Try fallback slug if available.
                    fallback_slug = _NORMALISED_FALLBACK_MAPPING.get(key)
                    if fallback_slug:
                        svg = fetch_lucide_icon(fallback_slug)

                if svg is None:
                    failed += 1
                    results[name] = ImportResult(
                        name=name, status="Failed", detail="SVG not found on Lucide CDN"
                    )
                    self.stderr.write(f"[FAILED] {name}: SVG not found")
                    continue

                processed = ensure_svg_visible_on_dark(svg)
                if not is_svg_bytes(processed):
                    failed += 1
                    results[name] = ImportResult(
                        name=name,
                        status="Failed",
                        detail="processing produced invalid SVG",
                    )
                    self.stderr.write(f"[FAILED] {name}: invalid SVG after processing")
                    continue

                icon_content = ContentFile(processed)
                new_filename = filename_for_icon(name, processed)

                service.icon.save(new_filename, icon_content, save=False)
                service.save(update_fields=["icon"])

                imported += 1
                results[name] = ImportResult(
                    name=name, status="Imported", detail="downloaded+processed"
                )
                self.stdout.write(f"[IMPORTED] {name}")

            except Exception as e:
                failed += 1
                detail = f"{type(e).__name__}: {e}"
                results[name] = ImportResult(name=name, status="Failed", detail=detail)
                self.stderr.write(f"[FAILED] {name}: {detail}")
                self.stderr.write(traceback.format_exc())
                continue

        # Final report matching Technology importer style.
        self.stdout.write("\n===== Import Report =====")
        for name, r in sorted(results.items()):
            self.stdout.write(f"{name.ljust(42)} {r.status}")

        self.stdout.write("\n===== Summary =====")
        self.stdout.write(f"Imported: {imported}")
        self.stdout.write(f"Skipped:  {skipped}")
        self.stdout.write(f"Failed:   {failed}")

        self.stdout.write("\nDone.")