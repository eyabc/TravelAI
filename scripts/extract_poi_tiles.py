import sys
import os
import xml.etree.ElementTree as ET
import json

if len(sys.argv) < 3:
    print("Usage: python extract_poi_tiles.py <input.osm> <output_dir>")
    sys.exit(1)

input_file = sys.argv[1]
output_dir = sys.argv[2]
os.makedirs(output_dir, exist_ok=True)

tree = ET.parse(input_file)
root = tree.getroot()

tile_size = 0.1
tiles = {}

for node in root.findall('node'):
    lat = float(node.attrib['lat'])
    lon = float(node.attrib['lon'])
    tags = {tag.attrib['k']: tag.attrib['v'] for tag in node.findall('tag')}
    if not tags.get('name'):
        continue
    tile_lat = round(lat * 10) / 10
    tile_lon = round(lon * 10) / 10
    tile_key = f'{tile_lat:.1f}_{tile_lon:.1f}'
    poi = {
        'id': node.attrib['id'],
        'lat': lat,
        'lon': lon,
        'name': tags.get('name', ''),
        'type': tags.get('tourism', tags.get('historic', '')),
        'address': tags.get('addr:full', tags.get('addr:street', ''))
    }
    tiles.setdefault(tile_key, []).append(poi)

for tile_key, pois in tiles.items():
    with open(os.path.join(output_dir, f'{tile_key}.json'), 'w', encoding='utf-8') as f:
        json.dump(pois, f, ensure_ascii=False)
