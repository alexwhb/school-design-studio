#!/usr/bin/env python3
"""Rebuilds the bundled sample elements in a Western school style.

The originals were Chinese retail artwork — pastel kawaii speech bubbles,
hearts and sparkles. Translating the words did not fix that, so these replace
them outright:

  1-3, 7-13  "Text with effects"     ten stacked-effect presets
  4-6        "Sample element groups" ribbon, award badge, event card

The text presets do double duty. The Text panel inserts one whole — wording,
font and effect stack — and the Text effects section of the settings panel
lists the same file behind its Choose button, where it takes the effect stack
alone and leaves the text you already have.

Nothing here loads a remote image. The groups are built from shapes already in
the library (service/src/mock/materials/svg.json), so they are self-contained
and recolourable.

Run make-sample-covers.mjs afterwards to size the text and regenerate the
thumbnails.
"""
import json
import os
import urllib.parse
import uuid as uuidlib

MOCK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'service', 'src', 'mock')
DETAIL = os.path.join(MOCK, 'components', 'detail')
LIST = os.path.join(MOCK, 'components', 'list')
SHAPES = os.path.join(MOCK, 'materials', 'svg.json')

# A restrained school palette: collegiate navy, a warm red, brass, cream.
NAVY = '#1E3A5Fff'
RED = '#C0392Bff'
GOLD = '#E1A731ff'
CREAM = '#FBF7EFff'
WHITE = '#FFFFFFff'
INK = '#22252Aff'
TEAL = '#1F6F6Bff'
VIOLET = '#6D28D9ff'

# Effect layers lean on translucency more than flat artwork does: a cast
# shadow, a glow and a drop shadow are all the same colour at a lower alpha.
NAVY_CAST = '#1E3A5F4D'
VIOLET_GLOW = '#6D28D966'
SOFT_SHADOW = '#00000038'


def font(name, file):
    return {'alias': name, 'id': 0, 'value': name, 'url': f'/fonts/{file}'}


ANTON = font('Anton', 'anton-400.woff2')
ARCHIVO = font('Archivo', 'archivo-400-700.woff2')
MERRIWEATHER = font('Merriweather', 'merriweather-400-700.woff2')
BEBAS = font('Bebas Neue', 'bebas-neue-400.woff2')
INTER = font('Inter', 'inter-400-700.woff2')
FREDOKA = font('Fredoka', 'fredoka-400-700.woff2')
PACIFICO = font('Pacifico', 'pacifico-400.woff2')

sid = lambda: uuidlib.uuid4().hex[:12]


def effect(filling=None, stroke=None, shadow=None, offset=None, skew=None):
    """One layer of a stacked text effect. Absent parts are simply disabled.

    Layers paint in array order, so the array reads back to front: the face of
    the lettering is the last entry, and everything before it is what sits
    behind. The settings panel shows them the other way up, nearest first.
    """
    return {
        'filling': filling or {'enable': False, 'type': 0, 'color': WHITE},
        'stroke': stroke or {'enable': False, 'type': 'center', 'color': NAVY, 'width': 0},
        'shadow': shadow or {'enable': False, 'color': NAVY, 'offsetX': 0, 'offsetY': 0, 'blur': 0},
        'offset': offset or {'enable': False, 'x': 0, 'y': 0},
        'skew': skew or {'enable': False, 'x': 0, 'y': 0},
    }


def solid(colour):
    return {'enable': True, 'type': 0, 'color': colour}


def gradient(angle, *stops):
    """A fill painted as a gradient and clipped to the glyphs.

    `color` stays set as the flat fallback: it is what the swatch in the panel
    opens on, and what a renderer that cannot clip a background to text falls
    back to.
    """
    return {
        'enable': True, 'type': 2, 'color': stops[0][0],
        'gradient': {'angle': angle, 'stops': [{'color': c, 'offset': o} for c, o in stops]},
    }


def text_widget(text, *, font_, size, colour=INK, weight=400, align='center',
                width=800, height=0, left=24, top=24, parent='-1', effects=None,
                line_height=1.15, spacing=0):
    return {
        'name': 'Text', 'type': 'w-text', 'uuid': sid(), 'editable': False,
        'left': left, 'top': top, 'transform': '',
        'lineHeight': line_height, 'letterSpacing': spacing,
        'fontSize': size, 'fontClass': dict(font_), 'fontFamily': font_['value'],
        'fontWeight': weight, 'fontStyle': 'normal', 'writingMode': 'horizontal-tb',
        'textDecoration': 'none', 'color': colour,
        'textAlign': align, 'text': urllib.parse.quote(text),
        'opacity': 1, 'backgroundColor': '', 'parent': parent,
        'record': {'width': 0, 'height': 0, 'minWidth': 0, 'minHeight': 0, 'dir': 'horizontal'},
        'width': width, 'height': height or int(size * 1.3), 'rotate': 0,
        **({'textEffects': effects} if effects else {}),
    }


def load_shape(title):
    """Pulls a shape's markup and palette out of the element library."""
    for item in json.load(open(SHAPES, encoding='utf-8')):
        if item['title'].lower() == title.lower():
            return item
    raise SystemExit(f'shape not found: {title}')


def svg_widget(title, *, colours, left, top, width, height, parent):
    shape = load_shape(title)
    return {
        'name': 'Shape', 'type': 'w-svg', 'uuid': sid(),
        'width': width, 'height': height, 'colors': colours,
        'left': left, 'top': top, 'transform': '', 'radius': 0, 'opacity': 1,
        'parent': parent, 'svgUrl': shape['url'], 'setting': [],
        'record': {'width': 0, 'height': 0, 'minWidth': 10, 'minHeight': 10},
    }


def group(children, width, height):
    """Wraps widgets in a container. The container goes last, as the app expects."""
    gid = sid()
    for child in children:
        child['parent'] = gid
    container = {
        'name': 'Group', 'type': 'w-group', 'uuid': gid,
        'width': width, 'height': height, 'left': 0, 'top': 0,
        'transform': '', 'opacity': 1, 'parent': '-1', 'isContainer': True,
        'record': {'width': 0, 'height': 0, 'minWidth': 0, 'minHeight': 0, 'dir': 'none'},
    }
    return children + [container]


# ---------------------------------------------------------------- samples ---

def sample_varsity():
    """White face, navy outline, solid offset shadow. Sports-day poster type."""
    return text_widget(
        'FIELD DAY', font_=ANTON, size=170, colour=WHITE, align='center', spacing=2,
        effects=[
            effect(stroke={'enable': True, 'type': 'center', 'color': NAVY, 'width': 14},
                   offset={'enable': True, 'x': 7, 'y': 9}),
            effect(stroke={'enable': True, 'type': 'center', 'color': NAVY, 'width': 14}),
            effect(filling={'enable': True, 'type': 0, 'color': WHITE}),
        ])


def sample_retro():
    """Flat colour with a hard offset shadow — no blur, no outline."""
    return text_widget(
        'WELL DONE', font_=ARCHIVO, size=150, weight=700, colour=GOLD, spacing=1,
        effects=[
            effect(filling={'enable': True, 'type': 0, 'color': RED},
                   offset={'enable': True, 'x': 10, 'y': 10}),
            effect(filling={'enable': True, 'type': 0, 'color': GOLD}),
        ])


def sample_classic():
    """A serif with a soft drop shadow. Reads as a programme or a certificate."""
    return text_widget(
        'Book Fair', font_=MERRIWEATHER, size=150, weight=700, colour=NAVY,
        effects=[
            effect(filling={'enable': True, 'type': 0, 'color': NAVY},
                   shadow={'enable': True, 'color': '#00000038', 'offsetX': 4, 'offsetY': 7, 'blur': 14}),
        ])


def sample_ribbon():
    """A banner with a title across it."""
    w, h = 900, 300
    return group([
        svg_widget('Banner', colours=[NAVY], left=0, top=70, width=w, height=160, parent=''),
        text_widget('SPORTS DAY', font_=BEBAS, size=104, colour=WHITE, spacing=4,
                    left=60, top=98, width=w - 120, height=110, parent=''),
    ], w, h)


def sample_badge():
    """An award rosette with a short line of praise."""
    size = 420
    return group([
        svg_widget('Badge', colours=[GOLD], left=0, top=0, width=size, height=size, parent=''),
        text_widget('WELL', font_=BEBAS, size=76, colour=WHITE, spacing=2,
                    left=40, top=140, width=size - 80, height=80, parent=''),
        text_widget('DONE', font_=BEBAS, size=76, colour=WHITE, spacing=2,
                    left=40, top=214, width=size - 80, height=80, parent=''),
    ], size, size)


def sample_card():
    """An event card: heading over a date line, on a soft panel."""
    w, h = 820, 340
    return group([
        svg_widget('Rounded rectangle', colours=[CREAM], left=0, top=0, width=w, height=h, parent=''),
        text_widget('Open Evening', font_=ARCHIVO, size=92, weight=700, colour=NAVY,
                    left=50, top=90, width=w - 100, height=110, parent=''),
        text_widget('Thursday 12 March  ·  6pm', font_=INTER, size=34, colour=INK,
                    left=50, top=206, width=w - 100, height=46, parent='', spacing=2),
    ], w, h)


SAMPLES = {
    '1': ('Varsity outline', sample_varsity),
    '2': ('Hard shadow', sample_retro),
    '3': ('Soft shadow', sample_classic),
    '4': ('Ribbon banner', sample_ribbon),
    '5': ('Award badge', sample_badge),
    '6': ('Event card', sample_card),
}


def main():
    sizes = {}
    for sid_, (title, build) in SAMPLES.items():
        data = build()
        if isinstance(data, list):
            width = max(w['left'] + w['width'] for w in data if not w.get('isContainer'))
            height = max(w['top'] + w['height'] for w in data if not w.get('isContainer'))
        else:
            width = data['left'] * 2 + data['width']
            height = data['top'] * 2 + data['height']

        record = {
            'id': int(sid_), 'cover': f'/covers/sample-{sid_}.png',
            'data': json.dumps(data, ensure_ascii=False),
            'title': title, 'width': round(width, 2), 'height': round(height, 2),
            'state': 1, 'tag': '',
        }
        json.dump(record, open(os.path.join(DETAIL, f'{sid_}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        sizes[sid_] = (title, record['width'], record['height'])
        print(f'{sid_}.json  {title:<18} {record["width"]:.0f}x{record["height"]:.0f}')

    for name, ids in (('text.json', ['1', '2', '3']), ('comp.json', ['4', '5', '6'])):
        items = [{
            'id': int(i), 'cover': f'/covers/sample-{i}.png', 'title': sizes[i][0],
            'width': sizes[i][1], 'height': sizes[i][2], 'state': 1,
        } for i in ids]
        json.dump(items, open(os.path.join(LIST, name), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        print(f'{name}: rewritten')


if __name__ == '__main__':
    main()
