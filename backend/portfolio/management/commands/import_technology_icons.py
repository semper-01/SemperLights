import hashlib

import os
import re
import sys
import time
import traceback
from dataclasses import dataclass
from typing import Dict, Iterable, Optional, Tuple
from urllib.parse import quote
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from portfolio.models import Technology


@dataclass(frozen=True)
class ImportResult:
    name: str
    status: str  # Imported|Skipped|Failed
    detail: str = ""


SIMPLE_ICONS_BASE = "https://cdn.simpleicons.org/"
SIMPLE_ICONS_SVG_SUFFIX = "?no-cache=1"

# Devicon fallback (SVGs stored at raw.githubusercontent.com)
DEVICON_BASE = "https://raw.githubusercontent.com/devicons/devicon/master/icons/"

# For technologies that don't match Simple Icons cleanly.
KNOWN_SIMPLE_ICON_SLUG_OVERRIDES: Dict[str, str] = {
    "c#": "csharp",
    "c++": "cplusplus",
    "css3": "css",
    "html5": "html5",
    "node.js": "nodedotjs",
    "jwt": "jsonwebtokens",
    "openai api": "openai",
    "django rest framework": "djangorestframework",
    "tailwind css": "tailwindcss",
    "scikit-learn": "scikitlearn",
    "raspberry pi": "raspberrypi",
    "esp32": "espressif",
    "github": "github",
    "git": "git",
    "mysql": "mysql",
    "postgresql": "postgresql",
    "typescript": "typescript",
    "javascript": "javascript",
    "python": "python",
    "react": "react",
    "flutter": "flutter",
    "docker": "docker",
    "django": "django",
    "figma": "figma",
    "vite": "vite",
    "supabase": "supabase",
    "postman": "postman",
    "canva": "canva",
    "arduino": "arduino",
    "bootstrap": "bootstrap",
    "php": "php",
    "nginx": "nginx",
    "tensorflow": "tensorflow",
    "hugging face": "huggingface",
    "adobe illustrator": "adobeillustrator",
    "adobe photoshop": "adobephotoshop",
    "artificial intelligence": "artificialintelligence",
}


def normalize_simpleicons_slug(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"&", "and", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-")
    return s


def simpleicons_try_fetch_svg(slug: str) -> Optional[bytes]:
    """Fetch SVG from Simple Icons CDN.

    Returns SVG bytes or None.
    """
    url = f"{SIMPLE_ICONS_BASE}{quote(slug)}"
    req = Request(url, headers={"User-Agent": "SemperLightsIconImporter/1.0"})
    try:
        with urlopen(req, timeout=25) as resp:
            data = resp.read()
            if not data.strip().lower().startswith(b"<svg"):
                return None
            return data
    except Exception:
        return None


def is_svg_bytes(data: bytes) -> bool:
    head = data.strip()[:200].lower()
    return head.startswith(b"<svg") or b"<svg" in head


def ensure_svg_visible_on_dark(svg_bytes: bytes) -> bytes:
    """Wrap SVG with a neutral rounded background if needed.

    Constraint: do not recolor. Do not stretch/crop.

    Implementation approach:
    - Parse viewBox if present.
    - Create a container SVG with same viewBox.
    - Draw rounded rect behind with a subtle neutral color.
    - Place the original SVG as-is inside.

    Note: This wrapper is applied conservatively; it always preserves the original.
    """

    text = svg_bytes.decode("utf-8", errors="ignore")

    viewbox_match = re.search(r"viewBox\s*=\s*\"([^\"]+)\"", text, flags=re.IGNORECASE)
    if viewbox_match:
        vb = viewbox_match.group(1)
    else:
        # Fallback to width/height.
        vb = "0 0 512 512"

    # Subtle neutral background that works on dark + light.
    # Uses currentColor? No—set an explicit neutral with alpha.
    wrapper = f"""<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"{vb}\">
  <rect x=\"0\" y=\"0\" width=\"100%\" height=\"100%\" rx=\"96\" ry=\"96\" fill=\"rgba(148,163,184,0.18)\" />
  <!-- Embedded original logo (verbatim) -->
  <g>
    {text}
  </g>
</svg>
"""

    # The embedded SVG may include its own <svg> root; keeping it as-is avoids
    # recoloring/cropping. Some SVGs may not render inside; in that case wrapper
    # still preserves bytes, but DOM may be nested incorrectly.
    # To improve compatibility, if the original includes an <svg> root, strip it.
    # We'll attempt that cheaply.
    if "<svg" in text.lower():
        # Strip outer <svg ...> and closing </svg>
        stripped = re.sub(r"^\s*<svg[^>]*>", "", text, flags=re.IGNORECASE | re.DOTALL)
        stripped = re.sub(r"</svg>\s*$", "", stripped, flags=re.IGNORECASE | re.DOTALL)
        wrapper = f"""<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"{vb}\">
  <rect x=\"0\" y=\"0\" width=\"100%\" height=\"100%\" rx=\"96\" ry=\"96\" fill=\"rgba(148,163,184,0.18)\" />
  {stripped}
</svg>
"""

    return wrapper.encode("utf-8")


def filename_for_icon(name: str, content: bytes) -> str:
    h = hashlib.sha256(content).hexdigest()[:16]
    safe = re.sub(r"[^a-zA-Z0-9_-]+", "_", name).strip("_")[:60]
    return f"{safe}_{h}.svg"


def download_svg_from_url(url: str) -> Optional[bytes]:
    req = Request(url, headers={"User-Agent": "SemperLightsIconImporter/1.0"})
    # Only used for SVG assets; callers must validate SVG content.

    try:
        with urlopen(req, timeout=25) as resp:
            data = resp.read()
            if not is_svg_bytes(data):
                return None
            return data
    except Exception:
        return None


DEVICON_ICON_SLUG_OVERRIDES: Dict[str, str] = {
    # Requested mapping examples (and extended as needed)
    "c#": "csharp",
    "django rest framework": "django",
    "openai api": "openai",
    "adobe photoshop": "photoshop",
    "adobe illustrator": "illustrator",
    "canva": "canva",
    "jwt": "jsonwebtokens",
    "c++": "cplusplus",
    "css3": "css3",
    "html5": "html5",
    "tailwind css": "tailwindcss",
    "node.js": "nodejs",
    "figma": "figma",
    "vite": "vite",
    "flutter": "flutter",
    "docker": "docker",
    "postgresql": "postgresql",
    "mysql": "mysql",
    "python": "python",
    "react": "react",
    "typescript": "typescript",
    "javascript": "javascript",
    "php": "php",
    "nginx": "nginx",
    "tensorflow": "tensorflow",
    "github": "github",
    "git": "git",
    "supabase": "supabase",
    "postman": "postman",
    "raspberry pi": "raspberrypi",
    "esp32": "espressif",
    "esp32": "esp32",
}


def devicon_try_fetch_svg(technology: Technology, slug_override: Optional[str] = None) -> Optional[bytes]:
    """Attempt to fetch an SVG from Devicon.

    Devicon naming is inconsistent across icons; we rely on a mapping.
    """

    key = (technology.name or "").strip().lower()
    dev_slug = slug_override or DEVICON_ICON_SLUG_OVERRIDES.get(key)
    if not dev_slug:
        return None

    # Devicons typically use <name>.svg, e.g. csharp.svg
    url = f"{DEVICON_BASE}{dev_slug}.svg"
    data = download_svg_from_url(url)
    if data is None:
        return None
    if not is_svg_bytes(data):
        return None
    return data


def fallback_official_svg(technology: Technology) -> Optional[bytes]:
    # Conservative fallback: try common favicon/icon paths as SVG.
    if not technology.website:
        return None

    site = technology.website.strip()
    if not re.match(r"^https?://", site, flags=re.IGNORECASE):
        site = "https://" + site

    # Try a few common patterns.
    candidates = [
        f"{site.rstrip('/')}/logo.svg",
        f"{site.rstrip('/')}/logo.png",  # reject if not SVG
        f"{site.rstrip('/')}/favicon.svg",
        f"{site.rstrip('/')}/favicon.ico",  # reject
        f"{site.rstrip('/')}/apple-touch-icon.svg",
        f"{site.rstrip('/')}/static/logo.svg",
    ]

    for c in candidates:
        data = download_svg_from_url(c)
        if data is not None:
            return data

    return None


class Command(BaseCommand):
    help = "Import official technology SVG icons into Technology.icon"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite existing Technology.icon fields.",
        )

    def handle(self, *args, **options):
        force: bool = bool(options.get("force"))

        results: Dict[str, ImportResult] = {}

        technologies = list(Technology.objects.all().only("id", "name", "website", "icon"))
        if not technologies:
            self.stdout.write(self.style.WARNING("No Technology records found."))
            return

        self.stdout.write(f"Found {len(technologies)} Technology records. Starting import...")

        imported = 0
        skipped = 0
        failed = 0

        for tech in technologies:
            name = tech.name
            try:
                if tech.icon and not force:
                    skipped += 1
                    results[name] = ImportResult(name=name, status="Skipped", detail="icon already set")
                    continue

                # 1) Try Simple Icons by slug match.
                slug = KNOWN_SIMPLE_ICON_SLUG_OVERRIDES.get(name.lower())
                if not slug:
                    slug = normalize_simpleicons_slug(name)

                print(f"Trying slug: {slug}")
                svg = simpleicons_try_fetch_svg(slug) if slug else None

                # If Simple Icons missed, try Devicon before going to website fallback.
                if svg is None:
                    svg = devicon_try_fetch_svg(tech)

                # If Devicon missed, try fallback.
                if svg is None:
                    svg = fallback_official_svg(tech)

                if svg is None:
                    failed += 1
                    results[name] = ImportResult(name=name, status="Failed", detail="SVG not found")
                    self.stderr.write(f"[FAILED] {name}: SVG not found")
                    continue

                processed = ensure_svg_visible_on_dark(svg)
                if not is_svg_bytes(processed):
                    failed += 1
                    results[name] = ImportResult(name=name, status="Failed", detail="processing produced invalid SVG")
                    self.stderr.write(f"[FAILED] {name}: invalid SVG after processing")
                    continue

                icon_content = ContentFile(processed)
                new_filename = filename_for_icon(name, processed)

                # Save to FileField using the model field.
                # Using save() to persist the FileField.
                tech.icon.save(new_filename, icon_content, save=False)
                tech.save(update_fields=["icon"])

                imported += 1
                results[name] = ImportResult(name=name, status="Imported", detail="downloaded+processed")
                self.stdout.write(f"[IMPORTED] {name}")

            except Exception as e:
                failed += 1
                detail = f"{type(e).__name__}: {e}"
                results[name] = ImportResult(name=name, status="Failed", detail=detail)
                self.stderr.write(f"[FAILED] {name}: {detail}")
                self.stderr.write(traceback.format_exc())
                continue

            time.sleep(0.05)

        # Final report.
        self.stdout.write("\n===== Import Report =====")
        for name, r in results.items():
            self.stdout.write(f"{name.ljust(22)} {r.status}")

        self.stdout.write("\n===== Summary =====")
        self.stdout.write(f"Imported: {imported}")
        self.stdout.write(f"Skipped:  {skipped}")
        self.stdout.write(f"Failed:   {failed}")

        self.stdout.write("\nDone.")

