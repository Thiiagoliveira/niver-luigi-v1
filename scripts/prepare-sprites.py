"""Build the local atlas from the original reference ZIP. Requires Pillow.
Usage: python scripts/prepare-sprites.py path/to/136282.zip
"""
import json
import sys
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
from PIL import Image

target = Path(__file__).resolve().parents[1] / 'src/assets/luigi'
(target / 'originals').mkdir(parents=True, exist_ok=True)
frames = [27, 30, 31, 32, 33, 34, 35, 121, 115]
atlas = Image.new('RGBA', (160 * len(frames), 272))
with ZipFile(sys.argv[1]) as archive:
    for index, number in enumerate(frames):
        name = f'Pera_Albedo.{number:04d}.png'
        data = archive.read(f'Individual frames/1/R/{name}')
        (target / 'originals' / name).write_bytes(data)
        image = Image.open(BytesIO(data)).convert('RGBA')
        image = image.crop(image.getbbox())
        atlas.alpha_composite(image, (index * 160 + (160 - image.width) // 2, 272 - image.height))
atlas.save(target / 'luigi-atlas.png', optimize=True)
(target / 'frames.json').write_text(json.dumps({
    'source': 'https://www.spriters-resource.com/nintendo_switch/papermariotheorigamiking/asset/136282/',
    'folder': 'Individual frames/1/R',
    'cell': {'width': 160, 'height': 272},
    'frames': frames, 'idle': 0, 'walk': [1, 2, 3, 4, 5, 6], 'pipe': 7, 'celebrate': 8,
    'note': 'R artwork faces screen-left. Mirrored horizontally in CSS for screen-right. Alpha bounds centered at a shared feet baseline, without rescaling or repainting.'
}, indent=2), encoding='utf-8')
print('Prepared nine original frames and a 1440 x 272 atlas.')
