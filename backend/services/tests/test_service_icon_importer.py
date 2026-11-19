import xml.etree.ElementTree as ET

from services.management.commands.import_service_icons import ensure_svg_visible_on_dark


SVG_NAMESPACE = '{http://www.w3.org/2000/svg}'


def test_service_icon_wrapper_accepts_xml_declaration_and_preserves_svg_root():
    source = b'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor">
  <path d="M1 1h2" />
</svg>'''

    root = ET.fromstring(ensure_svg_visible_on_dark(source))

    assert root.tag == f'{SVG_NAMESPACE}svg'
    assert root.find(f'{SVG_NAMESPACE}rect') is not None
    embedded_svg = root.find(f'{SVG_NAMESPACE}svg')
    assert embedded_svg is not None
    assert embedded_svg.attrib['stroke'] == 'currentColor'
    assert embedded_svg.find(f'{SVG_NAMESPACE}path') is not None
