#!/usr/bin/env python3
"""Rebuilds the bundled sample elements in a Western school style.

The originals were Chinese retail artwork — pastel kawaii speech bubbles,
hearts and sparkles. Translating the words did not fix that, so these replace
them outright:

  1-3, 7-26, 56-73, 116-117  "Text with effects"     forty-three presets
  4-6, 27-55, 74-115         "Sample element groups" seventy-four lockups

The text presets do double duty. The Text panel inserts one whole — wording,
font and effect stack — and the Text effects section of the settings panel
lists the same file behind its Choose button, where it takes the effect stack
alone and leaves the text you already have.

That second job is why a "Text with effects" preset has to be a single text
widget: the Choose button reads `.textEffects` off whatever the file holds, so
an array of widgets would break it. Seventeen presets the design files under
text need a second styled run, a rule, or a shape behind the words — none of
which one text run can carry — so they are built as element groups instead,
which is where the editor can actually offer them.

Nothing here loads a remote image. The groups are built from shapes already in
the library (service/src/mock/materials/svg.json) or from inline markup
written out below, so they are self-contained and recolourable.

Run make-sample-covers.mjs afterwards to size the text and regenerate the
thumbnails.
"""
import base64
import json
import math
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

# Tints of the five above, for the parts of a lockup that have to sit back:
# secondary lines, rules, panel fills, the unfilled half of a progress bar.
NAVY_DEEP = '#12283Fff'  # darker than NAVY, for panels the type sits on
NAVY_MID = '#24486Eff'
NAVY_TINT = '#D9E4ECff'
GOLD_LIGHT = '#F2CF7Eff'
GOLD_DEEP = '#8A5E0Eff'  # readable ink on a gold plate
TEAL_LIGHT = '#A9D8D3ff'
INK_SOFT = '#6B7885ff'
INK_FAINT = '#8C9AA8ff'
LINE = '#CFDAE3ff'
SILVER = '#B3C4D2ff'
CHALK_BG = '#23342Bff'
CHALK = '#F4F1E8ff'
NEON = '#FFEEC4ff'
PAPER = '#E4D9C4ff'  # the turned-back corner of a cream note
CLEAR = '#FFFFFF00'
SLATE = '#9DB4C8ff'
NAVY_SUNK = '#0D2138ff'  # type cut into a navy plate
NAVY_LIP = '#A9BBCBff'   # the light edge that lifts it back out
NAVY_FOLD = '#16314Fff'  # the turned-under end of a ribbon
TEAL_DEEP = '#0F5652ff'
TEAL_DARK = '#0B433Fff'
GOLD_PALE = '#FFD98Fff'
ROSE = '#FFD0C4ff'
ROSE_SOFT = '#FFDCD2ff'
PHOTO = '#6F7F8Cff'      # stands in for a photograph behind white type
OFF = '#DFE7EEff'        # an unfilled dot, swatch or lamp
RULE_SOFT = '#E6EDF2ff'
LEADER = '#B9A98Dff'     # the dotted run between a dish and its label
WRITE_ON = '#CDBFA5ff'   # a ruled line meant to be written on
HATCH = '#1E3A5F1F'      # the diagonal rule of a photo placeholder

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
OSWALD = font('Oswald', 'oswald-400-700.woff2')
PLAYFAIR = font('Playfair Display', 'playfair-display-400-700.woff2')
CAVEAT = font('Caveat', 'caveat-400-700.woff2')

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


def outline(colour, width):
    return {'enable': True, 'type': 'center', 'color': colour, 'width': width}


def cast(colour, x, y, blur):
    return {'enable': True, 'color': colour, 'offsetX': x, 'offsetY': y, 'blur': blur}


def shift(x, y):
    return {'enable': True, 'x': x, 'y': y}


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


def pattern(markup, size):
    """A fill painted with a tiling image and clipped to the glyphs.

    The editor's gradient fill is one linear gradient with stops, which cannot
    say "dots" or "checks". Its image fill can: the widget writes the value
    into `background-image`, and a background repeats by default, so a tile the
    size of one cell is all it takes.

    The trade is that the settings panel only offers a colour swatch for solid
    and gradient fills, so a layer filled this way is not recolourable there.
    That is why it is used for the three presets whose pattern *is* the preset
    and nowhere else.
    """
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
           f'viewBox="0 0 {size} {size}">{markup}</svg>')
    uri = 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode()
    return {'enable': True, 'type': 1, 'color': NAVY, 'imageContent': {'image': uri}}


def dot_tile(size, radius, colour, ground=None):
    back = f'<rect width="{size}" height="{size}" fill="{ground}"/>' if ground else ''
    return pattern(f'{back}<circle cx="{size / 2}" cy="{size / 2}" r="{radius}" fill="{colour}"/>', size)


def check_tile(cell, a, b):
    return pattern(
        f'<rect width="{cell * 2}" height="{cell * 2}" fill="{b}"/>'
        f'<rect width="{cell}" height="{cell}" fill="{a}"/>'
        f'<rect x="{cell}" y="{cell}" width="{cell}" height="{cell}" fill="{a}"/>',
        cell * 2)


def text_widget(text, *, font_, size, colour=INK, weight=400, align='center',
                width=800, height=0, left=24, top=24, parent='-1', effects=None,
                line_height=1.15, spacing=0, italic=False, decoration='none',
                background='', writing_mode='horizontal-tb', rotate=0):
    """One text widget.

    `decoration` is written straight into the element's inline `text-decoration`,
    so the CSS shorthand works — "underline #E1A731ff 18px" is how a preset gets
    a rule the settings panel has no control for. `background` fills the box
    behind the words; there is no padding property, so presets that want air
    around the type buy it with `line_height` instead.
    """
    return {
        'name': 'Text', 'type': 'w-text', 'uuid': sid(), 'editable': False,
        'left': left, 'top': top, 'transform': '',
        'lineHeight': line_height, 'letterSpacing': spacing,
        'fontSize': size, 'fontClass': dict(font_), 'fontFamily': font_['value'],
        'fontWeight': weight, 'fontStyle': 'italic' if italic else 'normal',
        'writingMode': writing_mode,
        'textDecoration': decoration, 'color': colour,
        'textAlign': align, 'text': urllib.parse.quote(text),
        'opacity': 1, 'backgroundColor': background, 'parent': parent,
        'record': {'width': 0, 'height': 0, 'minWidth': 0, 'minHeight': 0, 'dir': 'horizontal'},
        'width': width, 'height': height or int(size * 1.3),
        'rotate': f'{rotate}deg' if rotate else 0,
        **({'textEffects': effects} if effects else {}),
    }


def line(text, *, font_, size, left, cy, width, lines=1, **kw):
    """A text widget positioned by the vertical centre of its line box.

    Laying a group out from baselines means arithmetic on every widget; laying
    it out from centres means the numbers below read like the picture.
    """
    lh = kw.pop('line_height', 1.3)
    height = round(size * lh * lines)
    return text_widget(text, font_=font_, size=size, left=left, top=round(cy - height / 2),
                       width=width, height=height, line_height=lh, **kw)


def load_shape(title):
    """Pulls a shape's markup and palette out of the element library.

    Exact title first. The library holds a geometric "Star", "Heart", "Plus",
    "Check" and "Circle" alongside the lowercase Lucide icons of the same
    names, and those are different artwork — solid silhouettes against stroked
    line icons — so a case-insensitive match alone would hand back whichever
    happened to be listed first.
    """
    shapes = json.load(open(SHAPES, encoding='utf-8'))
    for item in shapes:
        if item['title'] == title:
            return item
    for item in shapes:
        if item['title'].lower() == title.lower():
            return item
    raise SystemExit(f'shape not found: {title}')


def shape_widget(markup, *, colours, left, top, width, height, parent=''):
    """A shape widget around inline SVG markup.

    Colours are substituted by the widget at render time wherever the markup
    says `{{colors[n]}}`, which is what keeps every part of a lockup
    recolourable once it is on the canvas.
    """
    return {
        'name': 'Shape', 'type': 'w-svg', 'uuid': sid(),
        'width': width, 'height': height, 'colors': list(colours),
        'left': left, 'top': top, 'transform': '', 'radius': 0, 'opacity': 1,
        'parent': parent, 'svgUrl': markup, 'setting': [],
        'record': {'width': 0, 'height': 0, 'minWidth': 10, 'minHeight': 10},
    }


def svg_widget(title, *, colours, left, top, width, height, parent=''):
    return shape_widget(load_shape(title)['url'], colours=colours, left=left,
                        top=top, width=width, height=height, parent=parent)


def draw(body, *, colours, left, top, width, height, parent=''):
    """A shape drawn to its own pixel size.

    The library's shapes carry a square viewBox and stretch to fit, which is
    right for a rectangle and wrong for anything with a corner radius or a
    fixed-width notch — those come out sheared. Giving the viewBox the widget's
    real dimensions means the numbers in `body` are the pixels on the page.
    """
    markup = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
              f'preserveAspectRatio="none">{body}</svg>')
    return shape_widget(markup, colours=colours, left=left, top=top,
                        width=width, height=height, parent=parent)


def photo_plate(*, left, top, width, height, radius=0, parent=''):
    """The hatched rectangle that stands in for a photograph.

    Drawn rather than fetched, so a preset can show where a picture goes
    without shipping one. Dropping an image on top is the point.
    """
    body = [f'<rect width="{width}" height="{height}" rx="{radius}" fill="{{{{colors[0]}}}}"/>']
    for x in range(-height, width, 34):
        body.append(f'<line x1="{x}" y1="0" x2="{x + height}" y2="{height}" '
                    f'stroke="{{{{colors[1]}}}}" stroke-width="8"/>')
    return draw(''.join(body), colours=[NAVY_TINT, HATCH], left=left, top=top,
                width=width, height=height, parent=parent)


def box(colour, *, left, top, width, height, radius=0, corners=None, border=None, parent=''):
    """A filled rectangle, optionally with only some corners rounded.

    `border` draws a hairline round it, which is what keeps a white or cream
    card visible: the thumbnails are transparent PNGs sitting on the panel's
    own tile, so a pale fill with no edge has nothing to separate it from the
    paper behind.
    """
    edge = (f'<rect x="1" y="1" width="{width - 2}" height="{height - 2}" rx="{radius}" '
            f'fill="none" stroke="{{{{colors[1]}}}}" stroke-width="2"/>') if border else ''
    if corners is None:
        body = f'<rect x="0" y="0" width="{width}" height="{height}" rx="{radius}" fill="{{{{colors[0]}}}}"/>'
    else:
        tl, tr, br, bl = (radius if c else 0 for c in corners)
        body = (f'<path d="M{tl},0 H{width - tr} A{tr},{tr} 0 0 1 {width},{tr} '
                f'V{height - br} A{br},{br} 0 0 1 {width - br},{height} '
                f'H{bl} A{bl},{bl} 0 0 1 0,{height - bl} '
                f'V{tl} A{tl},{tl} 0 0 1 {tl},0 Z" fill="{{{{colors[0]}}}}"/>')
    colours = [colour, border] if border else [colour]
    return draw(body + edge, colours=colours, left=left, top=top,
                width=width, height=height, parent=parent)


def group(children):
    """Wraps widgets in a container. The container goes last, as the app expects.

    Its size is measured off the children rather than passed in. The panel
    centres a group on the page using the container's box, so a container that
    disagrees with the artwork inside it drops the group off-centre — and a
    hand-written size drifts the moment the layout above it is touched.
    """
    gid = sid()
    width = max(c['left'] + c['width'] for c in children)
    height = max(c['top'] + c['height'] for c in children)
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
    ])


def sample_badge():
    """An award rosette with a short line of praise."""
    size = 420
    return group([
        svg_widget('Badge', colours=[GOLD], left=0, top=0, width=size, height=size, parent=''),
        text_widget('WELL', font_=BEBAS, size=76, colour=WHITE, spacing=2,
                    left=40, top=140, width=size - 80, height=80, parent=''),
        text_widget('DONE', font_=BEBAS, size=76, colour=WHITE, spacing=2,
                    left=40, top=214, width=size - 80, height=80, parent=''),
    ])


def sample_card():
    """An event card: heading over a date line, on a soft panel."""
    w, h = 820, 340
    return group([
        svg_widget('Rounded rectangle', colours=[CREAM], left=0, top=0, width=w, height=h, parent=''),
        text_widget('Open Evening', font_=ARCHIVO, size=92, weight=700, colour=NAVY,
                    left=50, top=90, width=w - 100, height=110, parent=''),
        text_widget('Thursday 12 March  ·  6pm', font_=INTER, size=34, colour=INK,
                    left=50, top=206, width=w - 100, height=46, parent='', spacing=2),
    ])


# ------------------------------------------------- text with effects (7-26) ---
# Every preset below is one text widget carrying a stack of effect layers.
# Layers paint in array order, so the array reads back to front and the face of
# the lettering is always the last entry.


def sample_extrude():
    """A block of solid navy dragged out behind the face, one step at a time.

    The step has to be a single pixel: at three the diagonals come out visibly
    stepped, so the depth comes from the number of layers instead.
    """
    return text_widget(
        'OPEN DAY', font_=OSWALD, size=150, weight=700, colour=CREAM, spacing=1,
        effects=[effect(filling=solid(NAVY), offset=shift(i, i)) for i in range(24, 0, -1)]
        + [effect(filling=solid(CREAM))])


def sample_long_shadow():
    """The same idea, but the trail fades out instead of stopping."""
    trail = [(42, '#1E3A5F2E'), (36, '#1E3A5F4D'), (30, '#1E3A5F6B'), (24, '#1E3A5F8A'),
             (18, '#1E3A5FA8'), (12, '#1E3A5FC7'), (6, '#1E3A5FE6')]
    return text_widget(
        'Bake Sale', font_=ARCHIVO, size=150, weight=700, colour=GOLD, spacing=-2,
        effects=[effect(filling=solid(colour), offset=shift(d, d)) for d, colour in trail]
        + [effect(filling=solid(GOLD))])


def sample_hollow():
    """Outline only. The widget's own colour is clear so nothing fills it in."""
    return text_widget(
        'SCIENCE FAIR', font_=OSWALD, size=150, weight=700, colour=CLEAR, spacing=2,
        effects=[effect(stroke=outline(NAVY, 8))])


def sample_double_outline():
    """Two rings, drawn as two stroke layers rather than as stacked shadows."""
    return text_widget(
        'Trophy Day', font_=ARCHIVO, size=150, weight=700, colour=CREAM, spacing=-1,
        effects=[
            effect(stroke=outline(GOLD, 22)),
            effect(stroke=outline(NAVY, 11)),
            effect(filling=solid(CREAM)),
        ])


def sample_marker():
    """A highlighter block behind the words.

    The editor paints a text box's background across the whole box, so this is
    a full-height wash rather than a marker stripe through the middle of the
    line. The generous line height is what keeps it from choking the type,
    since there is no padding to set.
    """
    return text_widget(
        'Reading Week', font_=ARCHIVO, size=140, weight=700, colour=INK,
        background=GOLD_LIGHT, line_height=1.9)


def sample_letterpress():
    """Tonal type with a light lip below and a dark one above. Light paper only."""
    return text_widget(
        'Quiet Please', font_=ARCHIVO, size=150, weight=700, colour=SILVER, spacing=-1,
        effects=[
            effect(filling=solid(SILVER), shadow=cast(WHITE, 3, 3, 2)),
            effect(filling=solid(SILVER), shadow=cast('#1E3A5F80', -3, -3, 6)),
        ])


def sample_neon():
    """Three widening glows under a pale face, on the dark panel it needs."""
    return text_widget(
        'DISCO NIGHT', font_=OSWALD, size=140, weight=700, colour=NEON, spacing=4,
        background=NAVY_DEEP, line_height=1.9,
        effects=[
            effect(shadow=cast('#E1A731B3', 0, 0, 100)),
            effect(shadow=cast('#E1A731CC', 0, 0, 50)),
            effect(shadow=cast('#E1A731E6', 0, 0, 18)),
            effect(filling=solid(NEON)),
        ])


def sample_two_tone():
    """Gold over navy, split across the middle by a gradient with no blend."""
    return text_widget(
        'HALF TERM', font_=OSWALD, size=150, weight=700, colour=GOLD, spacing=1,
        effects=[effect(filling=gradient(180, (GOLD, 0), (GOLD, 0.5), (NAVY, 0.5), (NAVY, 1)))])


def sample_varsity_block():
    """White face, navy ring, a gold slab thrown down and right. Team-sheet type."""
    return text_widget(
        'Varsity 26', font_=ARCHIVO, size=150, weight=700, colour=WHITE, spacing=1,
        effects=[
            effect(filling=solid(GOLD), offset=shift(20, 20)),
            effect(stroke=outline(NAVY, 12)),
            effect(filling=solid(WHITE)),
        ])


def sample_warm_gradient():
    """Brass into red across the words, over a hard navy shadow."""
    return text_widget(
        'Sunrise Run', font_=ARCHIVO, size=150, weight=700, colour=GOLD, spacing=-2,
        effects=[
            effect(filling=solid(NAVY), offset=shift(12, 12)),
            effect(filling=gradient(96, (GOLD, 0), (RED, 1))),
        ])


def sample_stripes():
    """Diagonal bands clipped to the glyphs.

    CSS would say `repeating-linear-gradient`; the editor's fill only knows one
    gradient with stops, so the repeat is written out as pairs of hard stops.
    """
    bands, stops = 12, []
    for i in range(bands):
        colour = NAVY if i % 2 == 0 else GOLD
        stops += [(colour, round(i / bands, 4)), (colour, round((i + 1) / bands, 4))]
    return text_widget(
        'CARNIVAL', font_=OSWALD, size=150, weight=700, colour=NAVY, spacing=2,
        effects=[effect(filling=gradient(315, *stops))])


def sample_sticker():
    """A fat white cut-line and a soft shadow, the way a die-cut sticker reads."""
    return text_widget(
        'Lost & Found', font_=FREDOKA, size=140, weight=700, colour=RED,
        effects=[
            effect(stroke=outline(WHITE, 33), shadow=cast('#1E3A5F47', 0, 18, 30)),
            effect(filling=solid(RED)),
        ])


def sample_speed():
    """A lean with the shadow thrown sideways, so it reads as motion not depth.

    Both layers carry the same skew, so the whole run leans together while the
    gold stays offset from the face.
    """
    lean = {'enable': True, 'x': -9, 'y': 0}
    return text_widget(
        'Fast Lane', font_=ARCHIVO, size=150, weight=700, colour=NAVY, spacing=-1,
        effects=[
            effect(filling=solid(GOLD), offset=shift(15, 0), skew=lean),
            effect(filling=solid(NAVY), skew=lean),
        ])


def sample_bubble():
    """Rounded face, heavy outline, and a shadow straight down rather than skewed."""
    return text_widget(
        'Bubble Time', font_=FREDOKA, size=140, weight=700, colour=CREAM,
        effects=[
            effect(stroke=outline(NAVY, 18), shadow=cast(GOLD, 0, 24, 0)),
            effect(filling=solid(CREAM)),
        ])


def sample_chalk():
    """A script with the bloom chalk leaves, on a board-green panel."""
    return text_widget(
        "Today's specials", font_=CAVEAT, size=150, weight=700, colour=CHALK,
        background=CHALK_BG, line_height=1.9,
        effects=[effect(filling=solid(CHALK), shadow=cast('#F4F1E859', 0, 0, 22))])


def sample_engraved():
    """Tone on tone with a light lip below — lettering cut into a brass plate."""
    return text_widget(
        "Head's Award", font_=ARCHIVO, size=140, weight=700, colour=GOLD_DEEP,
        background=GOLD, line_height=1.9, spacing=-1,
        effects=[effect(filling=solid(GOLD_DEEP), shadow=cast('#FFFFFF8C', 0, 5, 0))])


def sample_triple_echo():
    """Three offsets in three colours, stepping away from the face."""
    return text_widget(
        'PTA MEET', font_=OSWALD, size=150, weight=700, colour=CREAM, spacing=8,
        effects=[
            effect(filling=solid(NAVY), offset=shift(24, 24)),
            effect(filling=solid(TEAL), offset=shift(16, 16)),
            effect(filling=solid(GOLD), offset=shift(8, 8)),
            effect(filling=solid(CREAM)),
        ])


def sample_lifted():
    """An italic serif floating over its own shadow. Programmes, invitations."""
    return text_widget(
        'Graduation', font_=PLAYFAIR, size=150, weight=700, colour=NAVY, italic=True,
        effects=[effect(filling=solid(NAVY), shadow=cast('#1E3A5F59', 0, 40, 58))])


def sample_split_offset():
    """Two shadows pulling out of opposite corners. Art-room noticeboard type."""
    return text_widget(
        'Art Club', font_=ARCHIVO, size=150, weight=700, colour=TEAL, spacing=-1,
        effects=[
            effect(filling=solid(RED), offset=shift(-12, 12)),
            effect(filling=solid(GOLD), offset=shift(12, -12)),
            effect(filling=solid(TEAL)),
        ])


def sample_thick_underline():
    """A rule that follows the words, so it re-wraps with them.

    `text-decoration` takes a thickness and a colour in one shorthand, which is
    more than the underline button in the settings panel can say.
    """
    return text_widget(
        'Newsletter', font_=ARCHIVO, size=140, weight=700, colour=NAVY, spacing=-1,
        decoration=f'underline {GOLD} 18px')


# ------------------------------------------------ text with effects (56-73) ---


def sample_ghost_stack():
    """No fill at all, and a solid gold slab where the shadow would be."""
    return text_widget(
        'HALF DAY', font_=OSWALD, size=150, weight=700, colour=CLEAR, spacing=2,
        effects=[
            effect(filling=solid(GOLD), offset=shift(28, 28)),
            effect(stroke=outline(NAVY, 7)),
        ])


def sample_fade_fill():
    """Navy at the cap line washing out to slate at the baseline."""
    return text_widget(
        'Winter Term', font_=ARCHIVO, size=150, weight=700, colour=NAVY, spacing=-2,
        effects=[effect(filling=gradient(180, (NAVY, 0.18), (SLATE, 1)))])


def sample_three_band():
    """Red, brass and teal in equal bands, over a hard navy shadow."""
    return text_widget(
        'SUMMER FETE', font_=OSWALD, size=150, weight=700, colour=RED, spacing=1,
        effects=[
            effect(filling=solid('#1E3A5FE6'), offset=shift(9, 9)),
            effect(filling=gradient(180, (RED, 0), (RED, 0.33), (GOLD, 0.33),
                                    (GOLD, 0.66), (TEAL, 0.66), (TEAL, 1))),
        ])


def sample_soft_aura():
    """Two wide glows in two colours, no offset. Warmth rather than depth."""
    return text_widget(
        'Warm Welcome', font_=FREDOKA, size=140, weight=700, colour=RED,
        effects=[
            effect(shadow=cast('#E1A73159', 0, 0, 130)),
            effect(shadow=cast('#C0392B80', 0, 0, 62)),
            effect(filling=solid(RED)),
        ])


def sample_small_caps():
    """A formal serif on a gold lip.

    `font-variant: small-caps` is not something the editor can set, so this is
    set in caps with the tracking opened up — the same restraint, reached the
    long way round.
    """
    return text_widget(
        "LEAVERS' BALL", font_=PLAYFAIR, size=120, weight=700, colour=NAVY,
        spacing=12, line_height=1.2,
        effects=[effect(filling=solid(NAVY), shadow=cast('#E1A7318C', 0, 9, 0))])


def sample_reverse_extrude():
    """The block thrown up and left instead of down and right."""
    steps = [(-8, TEAL_DARK), (-6, TEAL_DEEP), (-4, TEAL_DEEP), (-2, TEAL_DEEP)]
    return text_widget(
        'UP NEXT', font_=OSWALD, size=150, weight=700, colour=TEAL, spacing=1,
        effects=[effect(filling=solid(colour), offset=shift(d * 3, d * 3))
                 for d, colour in steps]
        + [effect(filling=solid(TEAL))])


def sample_photo_safe():
    """White type with enough shadow under it to survive a busy photograph.

    The grey plate is a stand-in for the picture. Delete it — clear the
    background colour — and drop the words on the real one.
    """
    return text_widget(
        'Over a photo', font_=ARCHIVO, size=140, weight=700, colour=WHITE,
        background=PHOTO, line_height=1.9, spacing=-1,
        effects=[effect(filling=solid(WHITE), shadow=cast('#00000099', 0, 9, 42))])


def sample_wavy_underline():
    """A hand-drawn sort of rule, from the decoration shorthand's wavy style."""
    return text_widget(
        'Show & Tell', font_=FREDOKA, size=140, weight=700, colour=NAVY,
        line_height=1.3, decoration=f'underline wavy {GOLD} 12px')


def sample_dotted_fill():
    """Halftone dots inside a thin outline."""
    return text_widget(
        'DOT DAY', font_=OSWALD, size=150, weight=700, colour=CLEAR, spacing=2,
        effects=[
            effect(stroke=outline(NAVY, 4)),
            effect(filling=dot_tile(26, 8.8, NAVY)),
        ])


def sample_checker_fill():
    """A two-colour check, cut to the letterforms."""
    return text_widget(
        'Chess Club', font_=ARCHIVO, size=150, weight=700, colour=NAVY, spacing=-1,
        effects=[effect(filling=check_tile(23, NAVY, GOLD))])


def sample_debossed():
    """Type cut into a navy plate: darker than the panel, lit from below."""
    return text_widget(
        'Staff Only', font_=ARCHIVO, size=140, weight=700, colour=NAVY_SUNK,
        background=NAVY, line_height=1.9,
        effects=[effect(filling=solid(NAVY_SUNK), shadow=cast('#A9BBCBD9', 0, 6, 0))])


def sample_tight_set():
    """Two short lines packed as tight as they will go. Gig-poster setting."""
    return text_widget(
        'BIG\nNIGHT IN', font_=ARCHIVO, size=150, weight=700, colour=NAVY,
        spacing=-5, line_height=0.92, align='left')


def sample_stepped_echo():
    """One echo close, then two further off and fainter."""
    return text_widget(
        'STEP UP', font_=OSWALD, size=150, weight=700, colour=CREAM, spacing=1,
        effects=[
            effect(filling=solid('#E1A73140'), offset=shift(86, 86)),
            effect(filling=solid('#E1A7318C'), offset=shift(52, 52)),
            effect(filling=solid(GOLD), offset=shift(17, 17)),
            effect(stroke=outline(NAVY, 6)),
            effect(filling=solid(CREAM)),
        ])


def sample_blur_cast():
    """A blurred shadow in a colour the type is not. Softer than a hard offset."""
    return text_widget(
        'Big Ghost', font_=ARCHIVO, size=150, weight=700, colour=NAVY, spacing=-2,
        effects=[effect(filling=solid(NAVY), shadow=cast('#C0392B73', 36, 42, 54))])


def sample_outline_glow():
    """An outline with the glow on the outline, not on a fill."""
    return text_widget(
        'GO GREEN', font_=OSWALD, size=150, weight=700, colour=CLEAR, spacing=3,
        effects=[
            effect(shadow=cast('#1F6F6B8C', 0, 0, 36)),
            effect(stroke=outline(TEAL, 7)),
        ])


def sample_hand_outline():
    """A script traced rather than filled — something for a child to colour in."""
    return text_widget(
        'Colour me in', font_=CAVEAT, size=170, weight=700, colour=CLEAR,
        effects=[effect(stroke=outline(NAVY, 6))])


def sample_italic_cast():
    """Five offsets fading back, under an italic serif."""
    trail = [(30, '#1E3A5F26'), (24, '#1E3A5F4D'), (18, '#1E3A5F80'),
             (12, '#1E3A5FB3'), (6, '#1E3A5FE6')]
    return text_widget(
        'Encore', font_=PLAYFAIR, size=150, weight=700, colour=RED, italic=True,
        effects=[effect(filling=solid(colour), offset=shift(d, d)) for d, colour in trail]
        + [effect(filling=solid(RED))])


def sample_gradient():
    """One fill, painted as a gradient and clipped to the glyphs."""
    return text_widget(
        'Spirit Week', font_=ARCHIVO, size=150, weight=700, colour=NAVY,
        effects=[effect(filling=gradient(120, (NAVY, 0), (TEAL, 1)))])


def sample_cast_shadow():
    """A leaning translucent copy, as if the lettering stood on the page.

    The skew pivots on the bottom of the box, so the shadow stays joined to the
    foot of the letters instead of sliding out from under them, and it leans
    right because the light is coming from the upper left.
    """
    return text_widget(
        'FIELD TRIP', font_=BEBAS, size=150, colour=NAVY, spacing=4,
        effects=[
            effect(filling=solid(NAVY_CAST), skew={'enable': True, 'x': -34, 'y': 0}),
            effect(filling=solid(NAVY)),
        ])


def sample_comic_halftone():
    """Red dots on brass behind a heavy navy line. Comic-strip lettering."""
    return text_widget(
        'Comic Day', font_=FREDOKA, size=140, weight=700, colour=RED, spacing=-1,
        effects=[
            effect(stroke=outline(NAVY, 15)),
            effect(filling=dot_tile(20, 8.4, RED, ground=GOLD)),
        ])


# --------------------------------------------- sample element groups (27-55) ---
# Each of these is a list of widgets wrapped in a container. Shapes carry their
# colours in `colors`, so every part stays recolourable once it is on the page.


def sample_arched():
    """Per-letter rotation, which one text run cannot do — so each letter is one."""
    letters = [('F', -16, 30), ('U', -11, 14), ('N', -6, 4),
               ('R', 4, 4), ('U', 9, 14), ('N', 14, 30)]
    xs = [0, 96, 192, 336, 432, 528]
    return group([
        line(ch, font_=OSWALD, size=110, weight=700, colour=TEAL,
             left=x, cy=105 + dy, width=110, rotate=deg)
        for (ch, deg, dy), x in zip(letters, xs)
    ])


def sample_bouncing():
    """Letters walked up and down off the baseline, one widget each."""
    letters = [('P', -16, 0, 72), ('l', 8, 76, 40), ('a', -12, 120, 62), ('y', 12, 186, 62),
               ('D', -14, 288, 78), ('a', 10, 370, 62), ('y', -10, 436, 62)]
    return group([
        line(ch, font_=FREDOKA, size=100, weight=700, colour=TEAL,
             left=x, cy=100 + dy, width=w)
        for ch, dy, x, w in letters
    ])


def sample_tracked_plate():
    """Wide tracking between two rules. Assemblies, notices, section headings."""
    w = 900
    return group([
        box(NAVY, left=0, top=0, width=w, height=8),
        line('ASSEMBLY', font_=OSWALD, size=88, weight=500, colour=NAVY,
             spacing=30, left=0, cy=92, width=w, align='center'),
        box(NAVY, left=0, top=176, width=w, height=8),
    ])


def sample_knockout_slab():
    """A filled navy box with a gold one thrown behind it."""
    w, h = 700, 150
    return group([
        box(GOLD, left=24, top=24, width=w, height=h),
        box(NAVY, left=0, top=0, width=w, height=h),
        line('HALL PASS', font_=OSWALD, size=72, weight=700, colour=CREAM,
             spacing=8, left=0, cy=75, width=w, align='center'),
    ])


def sample_heavy_rule():
    """A serif over a gold bar the full width of the lockup."""
    w = 660
    return group([
        line('Prize Giving', font_=PLAYFAIR, size=110, weight=700, colour=NAVY,
             left=0, cy=75, width=w, align='left'),
        box(GOLD, left=0, top=142, width=w, height=22),
    ])


def sample_seal():
    """A round stamp: solid disc, dashed inner ring, three lines of type."""
    size = 420
    ring = ('<circle cx="178" cy="178" r="176" fill="none" stroke="{{colors[0]}}" '
            'stroke-width="4" stroke-dasharray="14 12"/>')
    return group([
        svg_widget('Circle', colours=[NAVY], left=0, top=0, width=size, height=size),
        draw(ring, colours=['#FBF7EF8C'], left=32, top=32, width=356, height=356),
        line('CERTIFIED', font_=OSWALD, size=30, colour=GOLD, spacing=22,
             left=0, cy=138, width=size),
        line('Star\nReader', font_=PLAYFAIR, size=68, weight=700, colour=CREAM,
             left=0, cy=218, width=size, lines=2, line_height=1.05),
        line('2026', font_=OSWALD, size=28, colour='#FBF7EFB3', spacing=18,
             left=0, cy=302, width=size),
    ])


def sample_ticket():
    """Body, perforation, tear-off stub with the stub line set vertically."""
    w, h = 900, 260
    perf = ('<line x1="6" y1="12" x2="6" y2="248" stroke="{{colors[0]}}" '
            'stroke-width="5" stroke-dasharray="16 16"/>')
    return group([
        box(CREAM, left=0, top=0, width=660, height=h, radius=20, corners=(1, 0, 0, 1)),
        draw(perf, colours=[LINE], left=660, top=0, width=12, height=h),
        box(NAVY, left=680, top=0, width=220, height=h, radius=20, corners=(0, 1, 1, 0)),
        line('SCHOOL PLAY', font_=OSWALD, size=32, colour=RED, spacing=20,
             left=56, cy=66, width=560, align='left'),
        line('The Tempest', font_=ARCHIVO, size=64, weight=700, colour=NAVY,
             left=56, cy=132, width=560, align='left'),
        line('Fri 20 March · 7:00pm · Main Hall', font_=ARCHIVO, size=30,
             colour=INK_SOFT, left=56, cy=200, width=560, align='left'),
        text_widget('ADMIT ONE', font_=OSWALD, size=34, colour=CREAM, spacing=20,
                    left=766, top=24, width=48, height=212, align='center',
                    writing_mode='vertical-rl'),
    ])


def sample_date_block():
    """A date chip beside the detail, with a rule holding the two together."""
    w, h = 900, 240
    return group([
        box(RED, left=0, top=20, width=220, height=200, radius=14),
        line('MAR', font_=OSWALD, size=32, colour=CREAM, spacing=20,
             left=0, cy=64, width=220),
        line('12', font_=ARCHIVO, size=104, weight=700, colour=CREAM,
             left=0, cy=132, width=220, line_height=1),
        line('THU', font_=OSWALD, size=30, colour='#FBF7EFCC', spacing=16,
             left=0, cy=196, width=220),
        box(GOLD, left=262, top=30, width=8, height=180),
        line('Open Evening', font_=ARCHIVO, size=62, weight=700, colour=NAVY,
             left=300, cy=92, width=580, align='left'),
        line('Tours from 6pm · Sixth form talks 7pm\nReception entrance, Belmont Road',
             font_=ARCHIVO, size=30, colour=INK_SOFT, left=300, cy=170, width=580,
             lines=2, line_height=1.5, align='left'),
    ])


def sample_pennant():
    """A house flag with the tail cut out of the bottom edge."""
    w, h = 400, 460
    flag = '<polygon points="0,0 400,0 400,350 200,460 0,350" fill="{{colors[0]}}"/>'
    return group([
        draw(flag, colours=[TEAL], left=0, top=0, width=w, height=h),
        line('HOUSE', font_=OSWALD, size=32, colour='#FBF7EFCC', spacing=22,
             left=0, cy=72, width=w),
        line('OAK', font_=ARCHIVO, size=84, weight=700, colour=CREAM,
             left=0, cy=158, width=w, line_height=1.05),
        line('CHAMPIONS', font_=OSWALD, size=34, colour=GOLD_LIGHT, spacing=16,
             left=0, cy=250, width=w),
    ])


def sample_countdown():
    """Three chips counting down to the thing above them."""
    w, h = 760, 270
    chips = [('03', 'DAYS', NAVY, CREAM), ('11', 'HOURS', NAVY, CREAM),
             ('45', 'MINS', GOLD, GOLD_DEEP)]
    widgets = [line('SPORTS DAY IN', font_=OSWALD, size=32, colour=INK_SOFT,
                    spacing=24, left=0, cy=40, width=w)]
    for i, (value, label, fill, ink) in enumerate(chips):
        x = 90 + i * 200
        widgets += [
            box(fill, left=x, top=96, width=180, height=150, radius=14),
            line(value, font_=ARCHIVO, size=76, weight=700, colour=ink,
                 left=x, cy=152, width=180, line_height=1),
            line(label, font_=OSWALD, size=26, colour=ink, spacing=16,
                 left=x, cy=214, width=180),
        ]
    return group(widgets)


def sample_eyebrow():
    """Rule, kicker, headline, standfirst — the order a notice is read in."""
    w, h = 900, 340
    return group([
        box(GOLD, left=0, top=34, width=70, height=7),
        line('NOTICE TO PARENTS', font_=OSWALD, size=32, colour=RED, spacing=22,
             left=92, cy=38, width=560, align='left'),
        line('Term dates\nhave changed', font_=PLAYFAIR, size=84, weight=700,
             colour=NAVY, left=0, cy=152, width=760, lines=2, line_height=1.1,
             align='left'),
        line('The spring half term now runs 16–20 February.\nFull calendar on the school website.',
             font_=ARCHIVO, size=30, colour=INK_SOFT, left=0, cy=288, width=760,
             lines=2, line_height=1.5, align='left'),
    ])


def sample_alert():
    """A coloured band down the side is what marks this out from a plain card."""
    w, h = 900, 220
    diamond = '<polygon points="30,0 60,30 30,60 0,30" fill="{{colors[0]}}"/>'
    return group([
        box(CREAM, left=0, top=0, width=w, height=h, radius=20),
        box(RED, left=0, top=0, width=150, height=h, radius=20, corners=(1, 0, 0, 1)),
        draw(diamond, colours=[CREAM], left=45, top=80, width=60, height=60),
        line('Closed Monday', font_=ARCHIVO, size=48, weight=700, colour=NAVY,
             left=194, cy=78, width=660, align='left'),
        line('Staff training day. Breakfast club and\nafter-school clubs do not run.',
             font_=ARCHIVO, size=30, colour=INK_SOFT, left=194, cy=148, width=660,
             lines=2, line_height=1.5, align='left'),
    ])


def sample_pull_quote():
    """An oversized quote mark carrying the indent for everything beside it."""
    w, h = 900, 330
    return group([
        line('“', font_=PLAYFAIR, size=200, weight=700, colour=GOLD,
             left=0, cy=100, width=150, align='left', line_height=1),
        line('Every child left the trip talking about\nthe tide pools. That is the whole point.',
             font_=PLAYFAIR, size=40, weight=700, colour=NAVY, italic=True,
             left=150, cy=120, width=740, lines=2, line_height=1.4, align='left'),
        line('MS OKONJO · YEAR 4 LEAD', font_=OSWALD, size=30, colour=INK_SOFT,
             spacing=18, left=150, cy=260, width=740, align='left'),
    ])


def sample_steps():
    """Numbered discs down the left, one instruction each."""
    w, h = 900, 300
    rows = [('1', NAVY, CREAM, 'Collect a wristband at the gate'),
            ('2', GOLD, GOLD_DEEP, "Find your child's house tent"),
            ('3', TEAL, CREAM, 'Races begin at 10:15 sharp')]
    widgets = []
    for i, (num, fill, ink, label) in enumerate(rows):
        cy = 50 + i * 100
        widgets += [
            svg_widget('Circle', colours=[fill], left=0, top=cy - 46, width=92, height=92),
            line(num, font_=ARCHIVO, size=44, weight=700, colour=ink,
                 left=0, cy=cy, width=92),
            line(label, font_=ARCHIVO, size=38, colour=INK,
                 left=128, cy=cy, width=772, align='left'),
        ]
    return group(widgets)


def sample_rosette():
    """Pleated disc over two tails, with the placing in the middle."""
    w, h = 380, 470
    tails = ('<path d="M20,0 H80 L96,235 L56,196 L8,222 Z" fill="{{colors[0]}}"/>'
             '<path d="M90,0 H150 L162,222 L114,196 L74,235 Z" fill="{{colors[1]}}"/>')
    # The pleats are a ring of alternating wedges. A conic gradient would say
    # this in one line in CSS; in SVG it is 24 triangles, so they are counted
    # out here rather than written by hand.
    wedges, r, c = [], 170, 170
    for i in range(24):
        a0, a1 = math.radians(i * 15 - 90), math.radians((i + 1) * 15 - 90)
        p0 = (round(c + r * math.cos(a0), 1), round(c + r * math.sin(a0), 1))
        p1 = (round(c + r * math.cos(a1), 1), round(c + r * math.sin(a1), 1))
        wedges.append(f'<polygon points="{c},{c} {p0[0]},{p0[1]} {p1[0]},{p1[1]}" '
                      f'fill="{{{{colors[{i % 2}]}}}}"/>')
    return group([
        draw(tails, colours=[NAVY, NAVY_MID], left=105, top=196, width=170, height=240),
        draw(''.join(wedges), colours=[GOLD, '#C58E1Cff'], left=20, top=0, width=340, height=340),
        svg_widget('Circle', colours=[CREAM], left=65, top=45, width=250, height=250),
        svg_widget('Circle', colours=[NAVY], left=85, top=65, width=210, height=210),
        line('1st', font_=PLAYFAIR, size=76, weight=700, colour=GOLD,
             left=85, cy=152, width=210, line_height=1),
        line('PLACE', font_=OSWALD, size=26, colour=CREAM, spacing=24,
             left=85, cy=216, width=210),
    ])


def sample_schedule():
    """A two-column timetable on a card. Times set back, entries forward."""
    w, h = 900, 380
    entries = [('09:00', 'Whole-school assembly'),
               ('10:30', 'Year 5 swimming, bus leaves 10:15'),
               ('13:15', 'Choir rehearsal, music room'),
               ('15:30', 'Book fair opens in the library')]
    widgets = [
        box(WHITE, left=0, top=0, width=w, height=h, radius=24),
        line('FRIDAY TIMETABLE', font_=OSWALD, size=32, colour=RED, spacing=20,
             left=52, cy=62, width=560, align='left'),
    ]
    for i, (time, what) in enumerate(entries):
        cy = 132 + i * 60
        widgets += [
            line(time, font_=ARCHIVO, size=32, colour=INK_FAINT,
                 left=52, cy=cy, width=180, align='left'),
            line(what, font_=ARCHIVO, size=32, colour=INK,
                 left=232, cy=cy, width=620, align='left'),
        ]
    return group(widgets)


def sample_speech():
    """A bubble with a separate tail, so both can be moved and recoloured."""
    w, h = 680, 330
    tail = '<polygon points="0,0 70,0 16,56" fill="{{colors[0]}}"/>'
    return group([
        box(NAVY, left=0, top=0, width=w, height=270, radius=28),
        draw(tail, colours=[NAVY], left=90, top=268, width=70, height=58),
        line("Don't forget your wellies!", font_=ARCHIVO, size=48, weight=700,
             colour=CREAM, left=52, cy=100, width=576, align='left'),
        line('Forest school runs whatever the weather.', font_=ARCHIVO, size=30,
             colour='#B9C8D6ff', left=52, cy=182, width=576, align='left'),
    ])


def sample_contact():
    """The strip that goes along the bottom of a poster."""
    w, h = 900, 220
    return group([
        box(NAVY, left=0, top=0, width=w, height=h, radius=20),
        box(CREAM, left=40, top=50, width=120, height=120, radius=14),
        line('N', font_=PLAYFAIR, size=62, weight=700, colour=NAVY,
             left=40, cy=110, width=120),
        line('Northfield Primary School', font_=ARCHIVO, size=38, weight=700,
             colour=CREAM, left=196, cy=82, width=660, align='left'),
        line('1400 Belmont Road · (555) 018-4400\noffice@northfield.sch.uk',
             font_=ARCHIVO, size=30, colour='#A9BBCBff', left=196, cy=148,
             width=660, lines=2, line_height=1.45, align='left'),
    ])


def sample_side_tab():
    """A door sign: the room number on the tab, what happens inside on the card."""
    w, h = 900, 250
    return group([
        box(GOLD, left=0, top=0, width=140, height=h, radius=16, corners=(1, 0, 0, 1)),
        box(CREAM, left=140, top=0, width=760, height=h, radius=16, corners=(0, 1, 1, 0)),
        text_widget('ROOM 12', font_=OSWALD, size=34, colour=GOLD_DEEP, spacing=20,
                    left=48, top=42, width=46, height=166, align='center',
                    writing_mode='vertical-rl'),
        line('Art & Design', font_=ARCHIVO, size=54, weight=700, colour=NAVY,
             left=190, cy=88, width=660, align='left'),
        line('Mr Halloran · Years 5 and 6\nAprons on before you start',
             font_=ARCHIVO, size=30, colour=INK_SOFT, left=190, cy=168, width=660,
             lines=2, line_height=1.5, align='left'),
    ])


def sample_punch_tag():
    """A luggage tag, hole and all."""
    w, h = 720, 200
    hole = ('<circle cx="26" cy="26" r="19" fill="{{colors[0]}}" '
            'stroke="{{colors[1]}}" stroke-width="7"/>')
    return group([
        box(TEAL, left=0, top=0, width=w, height=h, radius=20),
        draw(hole, colours=[CREAM, '#0F5652ff'], left=36, top=74, width=52, height=52),
        line('FREE ENTRY', font_=ARCHIVO, size=58, weight=700, colour=CREAM,
             left=120, cy=78, width=560, align='left'),
        line('FAMILIES WELCOME', font_=OSWALD, size=30, colour=TEAL_LIGHT,
             spacing=20, left=120, cy=142, width=560, align='left'),
    ])


def sample_fundraising():
    """Raised against target, with the bar doing the arithmetic."""
    w, h = 900, 230
    return group([
        line('Library appeal', font_=ARCHIVO, size=44, weight=700, colour=NAVY,
             left=0, cy=40, width=500, align='left'),
        line('£6,400', font_=ARCHIVO, size=44, weight=700, colour=RED,
             left=400, cy=40, width=500, align='right'),
        box(NAVY_TINT, left=0, top=88, width=w, height=52, radius=26),
        box(GOLD, left=0, top=88, width=576, height=52, radius=26),
        line('64% OF TARGET', font_=OSWALD, size=28, colour=INK_SOFT, spacing=14,
             left=0, cy=190, width=400, align='left'),
        line('GOAL £10,000', font_=OSWALD, size=28, colour=INK_SOFT, spacing=14,
             left=500, cy=190, width=400, align='right'),
    ])


def sample_photo_frame():
    """A print with a handwritten caption. Drop a photo over the hatched plate."""
    w, h = 520, 520
    plate_w, plate_h = 464, 330
    hatch = [f'<rect x="0" y="0" width="{plate_w}" height="{plate_h}" fill="{{{{colors[0]}}}}"/>']
    for x in range(-plate_h, plate_w, 34):
        hatch.append(f'<line x1="{x}" y1="0" x2="{x + plate_h}" y2="{plate_h}" '
                     f'stroke="{{{{colors[1]}}}}" stroke-width="8"/>')
    return group([
        box(WHITE, left=0, top=0, width=w, height=h, radius=6),
        draw(''.join(hatch), colours=[NAVY_TINT, '#1E3A5F1A'],
             left=28, top=28, width=plate_w, height=plate_h),
        line('Drop a photo here', font_=INTER, size=24, colour=INK_FAINT,
             left=52, cy=330, width=400, align='left'),
        line('Year 3 trip, Whitby', font_=CAVEAT, size=54, weight=700, colour=NAVY,
             left=40, cy=435, width=440, align='left'),
    ])


def sample_folded_note():
    """A cream note with the top corner turned back."""
    w, h = 900, 300
    fold = '<polygon points="110,0 0,0 110,110" fill="{{colors[0]}}"/>'
    return group([
        box(CREAM, left=0, top=0, width=w, height=h),
        draw(fold, colours=[PAPER], left=790, top=0, width=110, height=110),
        line('REMINDER', font_=OSWALD, size=32, colour=RED, spacing=20,
             left=52, cy=62, width=560, align='left'),
        line('Return permission slips by Wednesday', font_=ARCHIVO, size=42,
             weight=700, colour=NAVY, left=52, cy=142, width=800, align='left'),
        line('Hand to the class teacher or the school office.', font_=ARCHIVO,
             size=30, colour=INK_SOFT, left=52, cy=222, width=800, align='left'),
    ])


def sample_scoreline():
    """Two houses, two colours, the result between them."""
    w, h = 800, 320
    sides = [(NAVY, 'OAK', '24', 40), (RED, 'ELM', '19', 570)]
    widgets = [line('VS', font_=OSWALD, size=46, colour=INK_FAINT, spacing=16,
                    left=300, cy=80, width=200)]
    for colour, house, score, x in sides:
        widgets += [
            svg_widget('Circle', colours=[colour], left=x, top=0, width=150, height=150),
            line(house, font_=OSWALD, size=34, colour=colour, spacing=14,
                 left=x - 25, cy=192, width=200),
            line(score, font_=ARCHIVO, size=84, weight=700, colour=colour,
                 left=x - 25, cy=262, width=200, line_height=1),
        ]
    return group(widgets)


def sample_checklist():
    """Empty boxes, so it can be printed and ticked by hand."""
    w, h = 900, 360
    items = ['Packed lunch and a water bottle', 'Waterproof coat, named',
             'Signed permission slip']
    check = ('<rect x="4" y="4" width="36" height="36" rx="8" fill="none" '
             'stroke="{{colors[0]}}" stroke-width="6"/>')
    widgets = [
        box(WHITE, left=0, top=0, width=w, height=h, radius=24),
        box(TEAL, left=0, top=0, width=w, height=14, radius=14, corners=(1, 1, 0, 0)),
        line('What to bring', font_=ARCHIVO, size=44, weight=700, colour=NAVY,
             left=52, cy=94, width=700, align='left'),
    ]
    for i, item in enumerate(items):
        cy = 176 + i * 66
        widgets += [
            draw(check, colours=[TEAL], left=52, top=cy - 22, width=44, height=44),
            line(item, font_=ARCHIVO, size=34, colour=INK,
                 left=120, cy=cy, width=730, align='left'),
        ]
    return group(widgets)


def sample_stat_strip():
    """Three numbers with hairlines between them."""
    w, h = 900, 220
    stats = [('842', 'PUPILS', NAVY), ('38', 'CLUBS', GOLD), ('94%', 'ATTENDANCE', TEAL)]
    widgets = [box(LINE, left=299, top=20, width=3, height=180),
               box(LINE, left=599, top=20, width=3, height=180)]
    for i, (value, label, colour) in enumerate(stats):
        x = i * 300
        widgets += [
            line(value, font_=ARCHIVO, size=88, weight=700, colour=colour,
                 left=x, cy=76, width=300, line_height=1),
            line(label, font_=OSWALD, size=26, colour=INK_SOFT, spacing=16,
                 left=x, cy=160, width=300),
        ]
    return group(widgets)


def sample_corner_banner():
    """A sash across the corner. The tilt is drawn into the shape, not applied
    to the widget, so it survives every renderer the same way."""
    w, h = 560, 420
    sash = '<polygon points="300,0 420,0 560,140 560,260" fill="{{colors[0]}}"/>'
    return group([
        box(CREAM, left=0, top=0, width=w, height=h, radius=20),
        draw(sash, colours=[RED], left=0, top=0, width=w, height=h),
        line('CANCELLED', font_=OSWALD, size=30, colour=CREAM, spacing=16,
             left=310, cy=100, width=300, rotate=45),
        line('Cross-country\nfixture', font_=ARCHIVO, size=52, weight=700,
             colour=NAVY, left=44, cy=296, width=460, lines=2, line_height=1.15,
             align='left'),
        line('Waterlogged course · new date to follow', font_=ARCHIVO, size=26,
             colour=INK_SOFT, left=44, cy=376, width=500, align='left'),
    ])


def sample_wayfinding():
    """Slab plus arrowhead. Point it by flipping the head and the group."""
    w, h = 620, 150
    head = '<polygon points="0,0 140,75 0,150" fill="{{colors[0]}}"/>'
    return group([
        box(NAVY, left=0, top=0, width=480, height=h),
        draw(head, colours=[NAVY], left=480, top=0, width=140, height=h),
        line('THIS WAY', font_=OSWALD, size=56, colour=CREAM, spacing=12,
             left=0, cy=75, width=480),
    ])


def sample_week_chips():
    """Three days at a glance, the current one inverted."""
    w, h = 760, 290
    days = [('MON', '09', 'Swimming', CREAM, NAVY, INK_SOFT, INK_FAINT, GOLD),
            ('WED', '11', 'Trip day', CREAM, NAVY, INK_SOFT, INK_FAINT, TEAL),
            ('FRI', '13', 'Book fair', NAVY, CREAM, '#B9C8D6ff', '#9DB0C2ff', RED)]
    widgets = []
    for i, (day, num, what, fill, ink, soft, faint, rule) in enumerate(days):
        x = i * 265
        widgets += [
            box(fill, left=x, top=0, width=230, height=h, radius=18),
            box(rule, left=x, top=h - 32, width=230, height=32, radius=18, corners=(0, 0, 1, 1)),
            line(day, font_=OSWALD, size=26, colour=faint, spacing=16,
                 left=x, cy=52, width=230),
            line(num, font_=ARCHIVO, size=60, weight=700, colour=ink,
                 left=x, cy=130, width=230, line_height=1.15),
            line(what, font_=ARCHIVO, size=26, colour=soft,
                 left=x, cy=200, width=230),
        ]
    return group(widgets)


# ---------------------------------------- sample element groups (74-115) ---
# The first twelve are filed under "Text with effects" in the design. They are
# lettering, but each needs a second styled run, a rule or a shape behind the
# words, so none of them can be the single text widget that section requires.


def sample_word_chips():
    """One word per chip, each its own colour."""
    chips = [('SPORTS', NAVY, CREAM, 380), ('DAY', GOLD, GOLD_DEEP, 250),
             ('2026', TEAL, CREAM, 280)]
    widgets, x = [], 0
    for word, fill, ink, w in chips:
        widgets += [
            box(fill, left=x, top=0, width=w, height=130, radius=14),
            line(word, font_=ARCHIVO, size=76, weight=700, colour=ink,
                 left=x, cy=65, width=w),
        ]
        x += w + 22
    return group(widgets)


def sample_ransom():
    """Every letter on its own tile, at its own angle. Cut from a magazine."""
    letters = [('T', NAVY, CREAM, -6), ('A', GOLD, GOLD_DEEP, 4), ('L', CREAM, NAVY, -3),
               ('E', RED, CREAM, 7), ('N', TEAL, CREAM, -5), ('T', NAVY, CREAM, 3),
               ('S', GOLD, GOLD_DEEP, -7)]
    widgets = []
    for i, (ch, fill, ink, deg) in enumerate(letters):
        x = i * 128
        # The tile turns inside its own widget rather than the widget turning,
        # so it lands the same way in every renderer; the letter above it uses
        # the widget's own rotation about the same centre.
        tile = (f'<g transform="rotate({deg} 65 75)">'
                f'<rect x="12" y="16" width="106" height="118" fill="{{{{colors[0]}}}}"/></g>')
        widgets += [
            draw(tile, colours=[fill], left=x, top=0, width=130, height=150),
            line(ch, font_=ARCHIVO, size=76, weight=700, colour=ink,
                 left=x, cy=75, width=130, rotate=deg),
        ]
    return group(widgets)


def sample_solid_over_outline():
    """A solid line over a hollow one — two runs, so two widgets."""
    w = 760
    return group([
        line('WORLD', font_=OSWALD, size=104, weight=700, colour=NAVY,
             spacing=2, left=0, cy=58, width=w, align='left'),
        line('BOOK DAY', font_=OSWALD, size=104, weight=700, colour=CLEAR,
             spacing=2, left=0, cy=168, width=w, align='left',
             effects=[effect(stroke=outline(GOLD, 6))]),
    ])


def sample_drop_cap():
    """An opening paragraph with its first letter set large beside it."""
    w, h = 900, 300
    return group([
        line('W', font_=PLAYFAIR, size=190, weight=700, colour=RED,
             left=0, cy=118, width=170, align='left', line_height=0.9),
        line('elcome back to a new school year.\nTerm begins on Wednesday 3\nSeptember, gates open from 8:40am.',
             font_=ARCHIVO, size=42, colour=INK, left=180, cy=140, width=720,
             lines=3, line_height=1.6, align='left'),
    ])


def sample_vertical_title():
    """A door or corridor title, set down the page against a rule."""
    w, h = 150, 640
    return group([
        text_widget('SCIENCE WING', font_=OSWALD, size=54, colour=TEAL, spacing=22,
                    left=0, top=0, width=76, height=h, align='center',
                    writing_mode='vertical-rl'),
        box(GOLD, left=100, top=0, width=10, height=h),
    ])


def sample_double_frame():
    """Two rules, one inside the other, with the words between them."""
    w, h = 700, 260
    frame = '<rect x="{i}" y="{i}" width="{iw}" height="{ih}" fill="none" stroke="{{colors[0]}}" stroke-width="{s}"/>'
    return group([
        draw(frame.format(i=4, iw=w - 8, ih=h - 8, s=8), colours=[GOLD],
             left=0, top=0, width=w, height=h),
        draw(frame.format(i=4, iw=w - 40, ih=h - 40, s=8), colours=[NAVY],
             left=14, top=14, width=w - 32, height=h - 32),
        line('EXHIBITION', font_=OSWALD, size=76, weight=600, colour=NAVY,
             spacing=14, left=0, cy=h // 2, width=w),
    ])


def sample_mixed_weight():
    """Two weights on one line, which is two runs and so two widgets."""
    return group([
        line('Maths', font_=ARCHIVO, size=96, weight=700, colour=NAVY,
             left=0, cy=62, width=300, align='left'),
        line('Week', font_=ARCHIVO, size=96, colour=INK_SOFT,
             left=310, cy=62, width=300, align='left'),
    ])


def sample_stacked_words():
    """Three words down the page, a colour each."""
    w = 640
    rows = [('EVERYONE', NAVY), ('READS', GOLD), ('TOGETHER', TEAL)]
    return group([
        line(word, font_=ARCHIVO, size=84, weight=700, colour=colour, spacing=-2,
             left=0, cy=46 + i * 88, width=w, align='left', line_height=0.98)
        for i, (word, colour) in enumerate(rows)
    ])


def sample_script_caps():
    """A handwritten line introducing a set one, which needs two fonts."""
    w = 640
    return group([
        line('the annual', font_=CAVEAT, size=88, weight=700, colour=RED,
             left=18, cy=52, width=w, align='left'),
        line('BIG QUIZ', font_=OSWALD, size=108, weight=700, colour=NAVY,
             spacing=3, left=0, cy=148, width=w, align='left'),
    ])


def sample_slash_run():
    """Details on one line with the dividers picked out in gold."""
    parts = [('YEAR 6', NAVY, 300), ('/', GOLD, 60), ('ROOM 4', NAVY, 300),
             ('/', GOLD, 60), ('9AM', NAVY, 200)]
    widgets, x = [], 0
    for text, colour, w in parts:
        widgets.append(line(text, font_=OSWALD, size=86, weight=700 if colour == GOLD else 600,
                            colour=colour, spacing=8, left=x, cy=56, width=w, align='left'))
        x += w
    return group(widgets)


def sample_pill_highlight():
    """A rounded highlight, which a text box's own background cannot be."""
    w, h = 720, 130
    return group([
        box(GOLD_LIGHT, left=0, top=0, width=w, height=h, radius=h // 2),
        line('Pick up at 3:15', font_=FREDOKA, size=72, weight=700, colour=GOLD_DEEP,
             left=0, cy=h // 2, width=w),
    ])


def sample_bar_behind():
    """A bar struck through the lower third of the words."""
    w, h = 760, 120
    return group([
        box(GOLD, left=0, top=76, width=w, height=28),
        line('SOLD OUT', font_=OSWALD, size=76, weight=600, colour=NAVY,
             spacing=20, left=0, cy=54, width=w),
    ])


# ------------------------------------------------------------------------------
# The thirty below are the design's own "Sample element groups" additions.


def sample_staff_card():
    """A photograph, a name and a role — the row a staff list is built from."""
    w, h = 900, 200
    return group([
        box(WHITE, left=0, top=0, width=w, height=h, radius=16),
        photo_plate(left=24, top=28, width=144, height=144, radius=72),
        line('Ms Priya Raval', font_=ARCHIVO, size=42, weight=700, colour=NAVY,
             left=200, cy=68, width=660, align='left'),
        line('HEAD OF YEAR 6', font_=OSWALD, size=26, colour=RED, spacing=18,
             left=200, cy=118, width=660, align='left'),
        line('p.raval@northfield.sch.uk', font_=ARCHIVO, size=28, colour=INK_SOFT,
             left=200, cy=160, width=660, align='left'),
    ])


def sample_qr_block():
    """Somewhere to paste a QR code, with the ask written beside it."""
    w, h = 760, 230
    return group([
        box(NAVY, left=0, top=0, width=w, height=h, radius=16),
        box(CREAM, left=26, top=30, width=170, height=170, radius=10),
        draw(''.join(
            f'<rect x="{(i % 5) * 34 + 2}" y="{(i // 5) * 34 + 2}" width="30" height="30" '
            f'fill="{{{{colors[0]}}}}"/>'
            for i in range(25) if i % 3 != 1),
            colours=[NAVY], left=26, top=30, width=170, height=170),
        line('Scan to book\nyour slot', font_=ARCHIVO, size=44, weight=700,
             colour=CREAM, left=226, cy=88, width=500, lines=2, line_height=1.2,
             align='left'),
        line('Parent conferences, 12–13 Nov', font_=ARCHIVO, size=28,
             colour=NAVY_LIP, left=226, cy=166, width=500, align='left'),
    ])


def sample_sponsor_strip():
    """Three empty plates to drop supporters' logos into."""
    w, h = 900, 190
    widgets = [
        line('WITH THANKS TO', font_=OSWALD, size=28, colour=INK_SOFT, spacing=20,
             left=0, cy=22, width=380, align='left'),
        box(LINE, left=400, top=20, width=500, height=3),
    ]
    for i in range(3):
        x = i * 302
        widgets += [
            box(WHITE, left=x, top=70, width=296, height=120, radius=10, border=LINE),
            line('logo', font_=INTER, size=26, colour=INK_FAINT,
                 left=x, cy=130, width=296),
        ]
    return group(widgets)


def sample_ring_gauge():
    """A figure read as a proportion of the ring around it."""
    size, pct = 300, 0.94
    r, sw = 128, 40
    circ = 2 * math.pi * r
    ring = (f'<circle cx="150" cy="150" r="{r}" fill="none" stroke="{{{{colors[0]}}}}" '
            f'stroke-width="{sw}"/>'
            f'<circle cx="150" cy="150" r="{r}" fill="none" stroke="{{{{colors[1]}}}}" '
            f'stroke-width="{sw}" stroke-dasharray="{circ * pct:.1f} {circ:.1f}" '
            f'transform="rotate(-90 150 150)"/>')
    return group([
        draw(ring, colours=[NAVY_TINT, TEAL], left=0, top=0, width=size, height=size),
        line('94%', font_=ARCHIVO, size=68, weight=700, colour=NAVY,
             left=0, cy=size // 2, width=size),
        line('Attendance', font_=ARCHIVO, size=42, weight=700, colour=NAVY,
             left=340, cy=118, width=420, align='left'),
        line('Autumn term,\nall year groups', font_=ARCHIVO, size=30, colour=INK_SOFT,
             left=340, cy=190, width=420, lines=2, line_height=1.5, align='left'),
    ])


def sample_menu_card():
    """Dishes with a dotted run out to their dietary mark."""
    w, h = 900, 380
    dishes = [('Tomato pasta bake', 'v'), ('Chicken & herb pie', 'gf'), ('Fruit crumble', 'v')]
    widgets = [
        box(CREAM, left=0, top=0, width=w, height=h, radius=16),
        line('Monday lunch', font_=PLAYFAIR, size=52, weight=700, colour=NAVY,
             left=48, cy=62, width=700, align='left'),
        line('MAIN HALL · 12:00', font_=OSWALD, size=26, colour=RED, spacing=20,
             left=48, cy=118, width=700, align='left'),
    ]
    leader = ('<line x1="0" y1="4" x2="{w}" y2="4" stroke="{{colors[0]}}" '
              'stroke-width="4" stroke-dasharray="4 10"/>')
    for i, (dish, mark) in enumerate(dishes):
        cy = 186 + i * 66
        widgets += [
            line(dish, font_=ARCHIVO, size=32, colour=INK,
                 left=48, cy=cy, width=440, align='left'),
            draw(leader.format(w=280), colours=[LEADER], left=500, top=cy - 4,
                 width=280, height=8),
            line(mark, font_=ARCHIVO, size=30, colour=INK_SOFT,
                 left=800, cy=cy, width=60, align='left'),
        ]
    return group(widgets)


def sample_name_badge():
    """Hand-written name under a printed header. Open evenings, trips, fairs."""
    w, h = 560, 340
    return group([
        box(WHITE, left=0, top=0, width=w, height=h, radius=14),
        draw(f'<rect x="3" y="3" width="{w - 6}" height="{h - 6}" rx="12" fill="none" '
             f'stroke="{{{{colors[0]}}}}" stroke-width="6"/>',
             colours=[NAVY], left=0, top=0, width=w, height=h),
        box(NAVY, left=6, top=6, width=w - 12, height=76, radius=8, corners=(1, 1, 0, 0)),
        line("HELLO, I'M", font_=OSWALD, size=34, colour=CREAM, spacing=22,
             left=6, cy=44, width=w - 12),
        line('Amara', font_=CAVEAT, size=96, weight=700, colour=NAVY,
             left=0, cy=200, width=w, line_height=1),
        line('Year 5 · Elm House', font_=ARCHIVO, size=28, colour=INK_SOFT,
             left=0, cy=282, width=w),
    ])


def sample_timeline():
    """Three dated milestones strung along one line."""
    w, h = 900, 200
    stops = [(NAVY, 'Apply', 'by 14 Jan', 'left', 0), (GOLD, 'Offers', '1 March', 'center', 300),
             (TEAL, 'Start', 'September', 'right', 600)]
    widgets = [box(LINE, left=18, top=14, width=w - 36, height=6)]
    for i, (colour, head, sub, align, x) in enumerate(stops):
        widgets.append(svg_widget('Circle', colours=[colour],
                                  left=i * (w - 38) // 2, top=0, width=38, height=38))
        widgets += [
            line(head, font_=ARCHIVO, size=34, weight=700, colour=NAVY,
                 left=x, cy=98, width=300, align=align),
            line(sub, font_=ARCHIVO, size=28, colour=INK_SOFT,
                 left=x, cy=146, width=300, align=align),
        ]
    return group(widgets)


def sample_diagonal_split():
    """One card, two fields, split on the slant."""
    w, h = 900, 250
    return group([
        box(NAVY, left=0, top=0, width=w, height=h, radius=16),
        draw(f'<path d="M{w * 0.56 + 60},0 H{w - 16} A16,16 0 0 1 {w},16 V{h - 16} '
             f'A16,16 0 0 1 {w - 16},{h} H{w * 0.56 - 60} Z" fill="{{{{colors[0]}}}}"/>',
             colours=[GOLD], left=0, top=0, width=w, height=h),
        line('THIS FRIDAY', font_=OSWALD, size=26, colour=GOLD_PALE, spacing=20,
             left=44, cy=62, width=420, align='left'),
        line('Wear it\nYellow Day', font_=ARCHIVO, size=50, weight=700, colour=CREAM,
             left=44, cy=150, width=420, lines=2, line_height=1.15, align='left'),
        line('£1', font_=ARCHIVO, size=66, weight=700, colour=GOLD_DEEP,
             left=600, cy=110, width=260, align='right', line_height=1),
        line('donation', font_=ARCHIVO, size=28, weight=700, colour=GOLD_DEEP,
             left=600, cy=162, width=260, align='right'),
    ])


def sample_rubber_stamp():
    """Two rules and a date, set at the angle a stamp lands at."""
    w, h = 620, 300
    deg = -7
    plate = (f'<g transform="rotate({deg} 310 150)">'
             f'<rect x="60" y="60" width="500" height="180" rx="10" fill="none" '
             f'stroke="{{{{colors[0]}}}}" stroke-width="9"/>'
             f'<rect x="76" y="76" width="468" height="148" rx="6" fill="none" '
             f'stroke="{{{{colors[0]}}}}" stroke-width="5"/></g>')
    return group([
        draw(plate, colours=[RED], left=0, top=0, width=w, height=h),
        line('APPROVED', font_=OSWALD, size=62, colour=RED, spacing=20,
             left=60, cy=132, width=500, rotate=deg),
        line('TRIP · 12 MAR 2026', font_=INTER, size=28, colour=RED, spacing=8,
             left=60, cy=196, width=500, rotate=deg),
    ])


def sample_price_tiers():
    """Three prices, with the one you want people to pick inverted."""
    w, h = 900, 200
    tiers = [('CHILD', '£3', WHITE, INK_SOFT, NAVY), ('FAMILY', '£8', NAVY, NAVY_LIP, GOLD_PALE),
             ('ON THE DOOR', '£4', WHITE, INK_SOFT, NAVY)]
    widgets = []
    for i, (label, price, fill, label_ink, price_ink) in enumerate(tiers):
        x = i * 302
        widgets += [
            box(fill, left=x, top=0, width=296, height=h, radius=14),
            line(label, font_=OSWALD, size=26, colour=label_ink, spacing=16,
                 left=x, cy=62, width=296),
            line(price, font_=ARCHIVO, size=64, weight=700, colour=price_ink,
                 left=x, cy=136, width=296, line_height=1.2),
        ]
    return group(widgets)


def sample_trip_times():
    """Out and back, side by side, under a coloured header."""
    w, h = 900, 280
    return group([
        box(WHITE, left=0, top=0, width=w, height=h, radius=14),
        box(TEAL, left=0, top=0, width=w, height=74, radius=14, corners=(1, 1, 0, 0)),
        line('COACH TRIP · YEAR 4', font_=OSWALD, size=30, colour=CREAM, spacing=20,
             left=40, cy=37, width=700, align='left'),
        box(RULE_SOFT, left=449, top=104, width=2, height=150),
        line('DEPART', font_=ARCHIVO, size=26, colour=INK_FAINT, spacing=12,
             left=40, cy=126, width=380, align='left'),
        line('08:45', font_=ARCHIVO, size=52, weight=700, colour=NAVY,
             left=40, cy=184, width=380, align='left'),
        line('Front car park', font_=ARCHIVO, size=28, colour=INK_SOFT,
             left=40, cy=238, width=380, align='left'),
        line('RETURN', font_=ARCHIVO, size=26, colour=INK_FAINT, spacing=12,
             left=490, cy=126, width=380, align='left'),
        line('16:20', font_=ARCHIVO, size=52, weight=700, colour=NAVY,
             left=490, cy=184, width=380, align='left'),
        line('Collect from the hall', font_=ARCHIVO, size=28, colour=INK_SOFT,
             left=490, cy=238, width=380, align='left'),
    ])


def sample_kit_list():
    """Four things to bring, two by two, each with a note under it."""
    w, h = 900, 260
    items = [('Wellies', 'named, in a bag'), ('Waterproof', 'coat with a hood'),
             ('Lunch', 'no glass bottles'), ('Sun cream', 'applied before school')]
    widgets = []
    for i, (head, note) in enumerate(items):
        x, y = (i % 2) * 460, (i // 2) * 136
        widgets += [
            box(CREAM, left=x, top=y, width=440, height=118, radius=12),
            line(head, font_=ARCHIVO, size=34, weight=700, colour=NAVY,
                 left=x + 28, cy=y + 42, width=384, align='left'),
            line(note, font_=ARCHIVO, size=28, colour=INK_SOFT,
                 left=x + 28, cy=y + 86, width=384, align='left'),
        ]
    return group(widgets)


def sample_leaderboard():
    """Four houses, four bars, longest at the top."""
    w, h = 900, 330
    houses = [('Oak', 0.92, '920', NAVY), ('Elm', 0.78, '780', RED),
              ('Ash', 0.64, '640', GOLD), ('Birch', 0.51, '510', TEAL)]
    bar_x, bar_w = 150, 620
    widgets = [line('HOUSE POINTS', font_=OSWALD, size=28, colour=INK_SOFT, spacing=20,
                    left=0, cy=22, width=500, align='left')]
    for i, (house, frac, points, colour) in enumerate(houses):
        cy = 90 + i * 66
        widgets += [
            line(house, font_=ARCHIVO, size=30, weight=700, colour=NAVY,
                 left=0, cy=cy, width=130, align='left'),
            box(NAVY_TINT, left=bar_x, top=cy - 18, width=bar_w, height=36, radius=18),
            box(colour, left=bar_x, top=cy - 18, width=round(bar_w * frac), height=36, radius=18),
            line(points, font_=ARCHIVO, size=30, colour=INK_SOFT,
                 left=790, cy=cy, width=110, align='right'),
        ]
    return group(widgets)


def sample_opening_hours():
    """Days against times, with the exception ruled off at the bottom."""
    w, h = 900, 320
    rows = [('Mon – Thu', '8:00 – 16:30', INK_SOFT), ('Friday', '8:00 – 15:45', INK_SOFT),
            ('School holidays', 'Closed', RED)]
    widgets = [
        box(WHITE, left=0, top=0, width=w, height=h, radius=16),
        line('Office hours', font_=ARCHIVO, size=42, weight=700, colour=NAVY,
             left=44, cy=70, width=700, align='left'),
        box(RULE_SOFT, left=44, top=238, width=w - 88, height=2),
    ]
    for i, (day, time, ink) in enumerate(rows):
        cy = 148 + i * 58 + (16 if i == 2 else 0)
        widgets += [
            line(day, font_=ARCHIVO, size=32, colour=INK, left=44, cy=cy, width=500, align='left'),
            line(time, font_=ARCHIVO, size=32, colour=ink, left=400, cy=cy, width=456, align='right'),
        ]
    return group(widgets)


def sample_emergency():
    """The number first, at the size it needs to be found at."""
    w, h = 900, 300
    return group([
        box(RED, left=0, top=0, width=w, height=h, radius=16),
        line('IN AN EMERGENCY', font_=OSWALD, size=28, colour=ROSE, spacing=22,
             left=48, cy=54, width=700, align='left'),
        line('(555) 018-4400', font_=ARCHIVO, size=62, weight=700, colour=CREAM,
             left=48, cy=126, width=760, align='left', line_height=1.1),
        line('School office, 7:45am – 5:00pm. Outside these hours\ncontact the duty officer on (555) 018-4411.',
             font_=ARCHIVO, size=30, colour=ROSE_SOFT, left=48, cy=224, width=780,
             lines=2, line_height=1.5, align='left'),
    ])


def sample_swatches():
    """The uniform colours, named, so nobody has to guess at "navy"."""
    w, h = 760, 240
    swatches = [(NAVY, 'Navy', None), (GOLD, 'Gold', None), (TEAL, 'Teal', None),
                (CREAM, 'Cream', PAPER)]
    widgets = [line('Uniform colours', font_=ARCHIVO, size=42, weight=700, colour=NAVY,
                    left=0, cy=30, width=600, align='left')]
    for i, (colour, name, edge) in enumerate(swatches):
        x = i * 130
        widgets += [
            box(colour, left=x, top=88, width=116, height=116, radius=14, border=edge),
            line(name, font_=ARCHIVO, size=26, colour=INK_SOFT, left=x, cy=224, width=116),
        ]
    return group(widgets)


def sample_book_spotlight():
    """A jacket beside the title, author and reading age."""
    w, h = 900, 220
    return group([
        box(WHITE, left=0, top=0, width=w, height=h, radius=14),
        photo_plate(left=24, top=24, width=140, height=172),
        line('BOOK OF THE WEEK', font_=OSWALD, size=26, colour=RED, spacing=20,
             left=200, cy=64, width=660, align='left'),
        line('The Lost Lighthouse', font_=ARCHIVO, size=44, weight=700, colour=NAVY,
             left=200, cy=124, width=660, align='left'),
        line('Ade Fisher · ages 8–11', font_=ARCHIVO, size=28, colour=INK_SOFT,
             left=200, cy=176, width=660, align='left'),
    ])


def sample_achievement_chips():
    """Rounded chips for the things worth naming on a certificate."""
    chips = [('100 books read', NAVY, CREAM, 350, None), ('Full attendance', GOLD, GOLD_DEEP, 360, None),
             ('Playground buddy', TEAL, CREAM, 390, None), ('Times tables gold', CREAM, NAVY, 400, PAPER)]
    widgets, x, y, w = [], 0, 0, 0
    for text, fill, ink, cw, edge in chips:
        if x + cw > 780:
            x, y = 0, y + 96
        widgets += [
            box(fill, left=x, top=y, width=cw, height=78, radius=39, border=edge),
            line(text, font_=ARCHIVO, size=32, weight=700, colour=ink,
                 left=x, cy=y + 39, width=cw),
        ]
        x += cw + 20
        w = max(w, x - 20)
    return group(widgets)


def sample_folded_ribbon():
    """A banner with both ends notched back, the way a real one folds."""
    w, h = 900, 170
    end = '<polygon points="0,0 70,0 70,{h} 0,{h} 28,{m}" fill="{{colors[0]}}"/>'
    return group([
        draw(end.format(h=h, m=h // 2), colours=[NAVY_FOLD], left=0, top=0, width=70, height=h),
        box(NAVY, left=70, top=0, width=760, height=h),
        draw(f'<polygon points="70,0 70,{h} 0,{h} 42,{h // 2} 0,0" fill="{{{{colors[0]}}}}"/>',
             colours=[NAVY_FOLD], left=830, top=0, width=70, height=h),
        line('SUMMER FAIR', font_=OSWALD, size=62, colour=CREAM, spacing=16,
             left=70, cy=66, width=760),
        line('Saturday 20 June · 11am', font_=ARCHIVO, size=28, colour=NAVY_LIP,
             left=70, cy=122, width=760),
    ])


def sample_wayfinding_disc():
    """A disc for a wall or a floor, pointing the way it is stuck."""
    size = 380
    return group([
        svg_widget('Circle', colours=[GOLD], left=0, top=0, width=size, height=size),
        draw('<polygon points="48,0 96,66 0,66" fill="{{colors[0]}}"/>',
             colours=[NAVY], left=142, top=96, width=96, height=66),
        line('YOU ARE\nHERE', font_=OSWALD, size=42, colour=GOLD_DEEP, spacing=16,
             left=0, cy=248, width=size, lines=2, line_height=1.3),
    ])


def sample_signup_sheet():
    """Times down the side and a ruled line to write a name on."""
    w, h = 900, 320
    widgets = [
        box(CREAM, left=0, top=0, width=w, height=h, radius=14),
        line('Reading volunteers', font_=ARCHIVO, size=42, weight=700, colour=NAVY,
             left=44, cy=58, width=700, align='left'),
        line('Add your name for a Tuesday slot', font_=ARCHIVO, size=28, colour=INK_SOFT,
             left=44, cy=108, width=700, align='left'),
    ]
    for i, time in enumerate(('9:00', '9:30', '10:00')):
        cy = 176 + i * 60
        widgets += [
            line(time, font_=ARCHIVO, size=30, colour=RED, left=44, cy=cy, width=130, align='left'),
            box(WRITE_ON, left=184, top=cy + 16, width=672, height=3),
        ]
    return group(widgets)


def sample_poster_header():
    """Title, rule, and the three facts along the bottom."""
    w, h = 900, 300
    return group([
        line('Spring\nConcert', font_=ARCHIVO, size=76, weight=700, colour=NAVY,
             spacing=-2, left=0, cy=88, width=w, lines=2, line_height=1.05, align='left'),
        box(GOLD, left=0, top=192, width=w, height=10),
        line('THU 14 MAY', font_=OSWALD, size=30, colour=INK_SOFT, spacing=16,
             left=0, cy=252, width=300, align='left'),
        line('7:00 PM', font_=OSWALD, size=30, colour=INK_SOFT, spacing=16,
             left=300, cy=252, width=300),
        line('MAIN HALL', font_=OSWALD, size=30, colour=INK_SOFT, spacing=16,
             left=600, cy=252, width=300, align='right'),
    ])


def sample_photo_split():
    """Picture on one side, the writing on the other."""
    w, h = 900, 300
    return group([
        box(WHITE, left=0, top=0, width=w, height=h, radius=14),
        photo_plate(left=0, top=0, width=396, height=h),
        line('FOREST SCHOOL', font_=OSWALD, size=26, colour=TEAL, spacing=20,
             left=436, cy=76, width=430, align='left'),
        line('Thursdays in\nthe woods', font_=ARCHIVO, size=42, weight=700, colour=NAVY,
             left=436, cy=152, width=430, lines=2, line_height=1.2, align='left'),
        line('Every Year 3 class, all weathers,\nfrom 12 September.', font_=ARCHIVO,
             size=28, colour=INK_SOFT, left=436, cy=246, width=430, lines=2,
             line_height=1.5, align='left'),
    ])


def sample_agenda():
    """Times against items, the times picked out so they can be scanned."""
    w, h = 900, 340
    items = [('18:00', 'Apologies and minutes'), ('18:15', "Head teacher's report"),
             ('18:45', 'Budget and staffing'), ('19:20', 'Any other business')]
    widgets = [line("GOVERNORS' MEETING", font_=OSWALD, size=28, colour=INK_SOFT,
                    spacing=20, left=0, cy=22, width=600, align='left')]
    for i, (time, what) in enumerate(items):
        cy = 106 + i * 72
        widgets += [
            line(time, font_=ARCHIVO, size=32, weight=700, colour=RED,
                 left=0, cy=cy, width=150, align='left'),
            line(what, font_=ARCHIVO, size=32, colour=INK,
                 left=170, cy=cy, width=730, align='left'),
        ]
    return group(widgets)


def sample_tear_off():
    """A noticeboard advert with the number cut into tabs along the bottom."""
    w, h = 620, 380
    widgets = [
        box(WHITE, left=0, top=0, width=w, height=h, radius=14, corners=(1, 1, 0, 0)),
        line('Cake bakers wanted', font_=ARCHIVO, size=44, weight=700, colour=NAVY,
             left=44, cy=76, width=540, align='left'),
        line('Drop off Friday before 9am', font_=ARCHIVO, size=28, colour=INK_SOFT,
             left=44, cy=136, width=540, align='left'),
        draw(f'<line x1="0" y1="3" x2="{w}" y2="3" stroke="{{{{colors[0]}}}}" '
             f'stroke-width="4" stroke-dasharray="14 12"/>',
             colours=[LINE], left=0, top=200, width=w, height=6),
    ]
    for i in range(4):
        x = i * 155
        if i:
            widgets.append(draw(f'<line x1="2" y1="0" x2="2" y2="176" stroke="{{{{colors[0]}}}}" '
                                f'stroke-width="4" stroke-dasharray="14 12"/>',
                                colours=[LINE], left=x, top=204, width=4, height=176))
        widgets.append(line('call\n4400', font_=INTER, size=24, colour=INK_SOFT,
                            left=x, cy=292, width=155, lines=2, line_height=1.4))
    return group(widgets)


def sample_photo_trio():
    """Three pictures in a row with one caption under them."""
    w, h = 900, 280
    widgets = [photo_plate(left=i * 306, top=0, width=288, height=210, radius=10)
               for i in range(3)]
    widgets.append(line('Sports day, June 2026 — photos by the PTA', font_=ARCHIVO,
                        size=28, colour=INK_SOFT, left=0, cy=250, width=w, align='left'))
    return group(widgets)


def sample_term_dates():
    """A three-column table with the header knocked out in navy."""
    w, h = 900, 300
    cols = (0, 340, 620)
    rows = [('Autumn', '3 Sep', '19 Dec'), ('Spring', '6 Jan', '27 Mar'),
            ('Summer', '14 Apr', '17 Jul')]
    widgets = [
        box(WHITE, left=0, top=0, width=w, height=h, radius=14),
        box(NAVY, left=0, top=0, width=w, height=72, radius=14, corners=(1, 1, 0, 0)),
    ]
    for x, head in zip(cols, ('TERM', 'STARTS', 'ENDS')):
        widgets.append(line(head, font_=OSWALD, size=26, colour=CREAM, spacing=14,
                            left=x + 36, cy=36, width=240, align='left'))
    for i, row in enumerate(rows):
        cy = 122 + i * 62
        if i:
            widgets.append(box(RULE_SOFT, left=0, top=cy - 32, width=w, height=2))
        for x, cell, ink in zip(cols, row, (INK, INK_SOFT, INK_SOFT)):
            widgets.append(line(cell, font_=ARCHIVO, size=30, colour=ink,
                                left=x + 36, cy=cy, width=240, align='left'))
    return group(widgets)


def sample_effort_dots():
    """A rating out of five, filled left to right. Reports and record cards."""
    w, h = 900, 300
    rows = [('Reading', 4), ('Writing', 3), ('Number', 5)]
    widgets = [
        box(WHITE, left=0, top=0, width=w, height=h, radius=16),
        line('Effort this half term', font_=ARCHIVO, size=42, weight=700, colour=NAVY,
             left=44, cy=70, width=700, align='left'),
    ]
    for i, (subject, score) in enumerate(rows):
        cy = 150 + i * 62
        dots = ''.join(f'<circle cx="{j * 46 + 16}" cy="16" r="16" '
                       f'fill="{{{{colors[{0 if j < score else 1}]}}}}"/>' for j in range(5))
        widgets += [
            line(subject, font_=ARCHIVO, size=32, colour=INK, left=44, cy=cy, width=400, align='left'),
            draw(dots, colours=[GOLD, OFF], left=624, top=cy - 16, width=232, height=32),
        ]
    return group(widgets)


def sample_clubs_list():
    """Four clubs, two by two, each flagged by a colour down its edge."""
    w, h = 900, 240
    clubs = [('Mon · Football', TEAL), ('Tue · Choir', GOLD),
             ('Wed · Art', RED), ('Thu · Coding', NAVY)]
    widgets = [line('After-school clubs', font_=ARCHIVO, size=42, weight=700, colour=NAVY,
                    left=0, cy=30, width=700, align='left')]
    for i, (club, colour) in enumerate(clubs):
        x, y = (i % 2) * 460, 88 + (i // 2) * 84
        widgets += [
            box(WHITE, left=x, top=y, width=440, height=66),
            box(colour, left=x, top=y, width=10, height=66),
            line(club, font_=ARCHIVO, size=30, colour=INK,
                 left=x + 32, cy=y + 33, width=390, align='left'),
        ]
    return group(widgets)


def sample_status_light():
    """Three lamps with one lit. Field open, field closed, ask first."""
    w, h = 900, 200
    return group([
        box(WHITE, left=0, top=0, width=w, height=h, radius=14),
        draw('<circle cx="22" cy="22" r="22" fill="{{colors[0]}}"/>'
             '<circle cx="22" cy="74" r="22" fill="{{colors[0]}}"/>'
             '<circle cx="22" cy="126" r="22" fill="{{colors[1]}}"/>',
             colours=[OFF, TEAL], left=40, top=28, width=44, height=148),
        line('Field open', font_=ARCHIVO, size=42, weight=700, colour=NAVY,
             left=128, cy=74, width=700, align='left'),
        line('Trainers are fine today.\nCheck the board each morning.', font_=ARCHIVO,
             size=28, colour=INK_SOFT, left=128, cy=136, width=700, lines=2,
             line_height=1.5, align='left'),
    ])


TEXT_SAMPLES = {
    '1': ('Varsity outline', sample_varsity),
    '2': ('Hard shadow', sample_retro),
    '3': ('Soft shadow', sample_classic),
    '7': ('Deep extrude', sample_extrude),
    '8': ('Long shadow', sample_long_shadow),
    '9': ('Hollow outline', sample_hollow),
    '10': ('Double outline', sample_double_outline),
    '11': ('Marker highlight', sample_marker),
    '12': ('Letterpress', sample_letterpress),
    '13': ('Neon glow', sample_neon),
    '14': ('Two-tone split', sample_two_tone),
    '15': ('Varsity block', sample_varsity_block),
    '16': ('Warm gradient fill', sample_warm_gradient),
    '17': ('Stripe fill', sample_stripes),
    '18': ('Sticker cut-out', sample_sticker),
    '19': ('Speed skew', sample_speed),
    '20': ('Bubble drop', sample_bubble),
    '21': ('Chalkboard hand', sample_chalk),
    '22': ('Engraved plate', sample_engraved),
    '23': ('Triple echo', sample_triple_echo),
    '24': ('Lifted serif', sample_lifted),
    '25': ('Split offset', sample_split_offset),
    '26': ('Thick underline', sample_thick_underline),
    '56': ('Ghost stack', sample_ghost_stack),
    '57': ('Fade fill', sample_fade_fill),
    '58': ('Retro three-band', sample_three_band),
    '59': ('Soft aura', sample_soft_aura),
    '60': ('Formal small caps', sample_small_caps),
    '61': ('Reverse extrude', sample_reverse_extrude),
    '62': ('Photo-safe white', sample_photo_safe),
    '63': ('Wavy underline', sample_wavy_underline),
    '64': ('Dotted fill', sample_dotted_fill),
    '65': ('Checker fill', sample_checker_fill),
    '66': ('Debossed on navy', sample_debossed),
    '67': ('Poster tight-set', sample_tight_set),
    '68': ('Stepped echo', sample_stepped_echo),
    '69': ('Coloured blur cast', sample_blur_cast),
    '70': ('Outline glow', sample_outline_glow),
    '71': ('Hand outline', sample_hand_outline),
    '72': ('Italic cast', sample_italic_cast),
    '73': ('Comic halftone', sample_comic_halftone),
    '116': ('Gradient fill', sample_gradient),
    '117': ('Cast shadow', sample_cast_shadow),
}

COMP_SAMPLES = {
    '4': ('Ribbon banner', sample_ribbon),
    '5': ('Award badge', sample_badge),
    '6': ('Event card', sample_card),
    '27': ('Arched', sample_arched),
    '28': ('Bouncing baseline', sample_bouncing),
    '29': ('Tracked plate', sample_tracked_plate),
    '30': ('Knockout slab', sample_knockout_slab),
    '31': ('Heavy rule', sample_heavy_rule),
    '32': ('Round seal', sample_seal),
    '33': ('Ticket stub', sample_ticket),
    '34': ('Date block lockup', sample_date_block),
    '35': ('Pennant', sample_pennant),
    '36': ('Countdown chips', sample_countdown),
    '37': ('Eyebrow headline', sample_eyebrow),
    '38': ('Alert bar', sample_alert),
    '39': ('Pull quote', sample_pull_quote),
    '40': ('Numbered steps', sample_steps),
    '41': ('Award rosette', sample_rosette),
    '42': ('Schedule card', sample_schedule),
    '43': ('Speech bubble', sample_speech),
    '44': ('Contact footer', sample_contact),
    '45': ('Side-tab card', sample_side_tab),
    '46': ('Punch-hole tag', sample_punch_tag),
    '47': ('Fundraising bar', sample_fundraising),
    '48': ('Photo frame + caption', sample_photo_frame),
    '49': ('Folded-corner note', sample_folded_note),
    '50': ('Match scoreline', sample_scoreline),
    '51': ('Checklist card', sample_checklist),
    '52': ('Stat strip', sample_stat_strip),
    '53': ('Corner banner', sample_corner_banner),
    '54': ('Wayfinding arrow', sample_wayfinding),
    '55': ('Week chips', sample_week_chips),
    '74': ('Word chips', sample_word_chips),
    '75': ('Ransom letters', sample_ransom),
    '76': ('Solid over outline', sample_solid_over_outline),
    '77': ('Drop cap opener', sample_drop_cap),
    '78': ('Vertical title', sample_vertical_title),
    '79': ('Double frame', sample_double_frame),
    '80': ('Mixed weight', sample_mixed_weight),
    '81': ('Stacked words', sample_stacked_words),
    '82': ('Script + caps', sample_script_caps),
    '83': ('Slash divider run', sample_slash_run),
    '84': ('Pill highlight', sample_pill_highlight),
    '85': ('Bar behind', sample_bar_behind),
    '86': ('Staff card', sample_staff_card),
    '87': ('QR booking block', sample_qr_block),
    '88': ('Sponsor strip', sample_sponsor_strip),
    '89': ('Ring gauge', sample_ring_gauge),
    '90': ('Menu card', sample_menu_card),
    '91': ('Name badge', sample_name_badge),
    '92': ('Milestone timeline', sample_timeline),
    '93': ('Diagonal split card', sample_diagonal_split),
    '94': ('Rubber stamp', sample_rubber_stamp),
    '95': ('Price tiers', sample_price_tiers),
    '96': ('Trip times', sample_trip_times),
    '97': ('Kit list grid', sample_kit_list),
    '98': ('House leaderboard', sample_leaderboard),
    '99': ('Opening hours', sample_opening_hours),
    '100': ('Emergency contact', sample_emergency),
    '101': ('Colour swatches', sample_swatches),
    '102': ('Book spotlight', sample_book_spotlight),
    '103': ('Achievement chips', sample_achievement_chips),
    '104': ('Folded ribbon', sample_folded_ribbon),
    '105': ('Wayfinding disc', sample_wayfinding_disc),
    '106': ('Sign-up sheet', sample_signup_sheet),
    '107': ('Poster header lockup', sample_poster_header),
    '108': ('Photo + text split', sample_photo_split),
    '109': ('Agenda list', sample_agenda),
    '110': ('Tear-off notice', sample_tear_off),
    '111': ('Photo trio', sample_photo_trio),
    '112': ('Term dates table', sample_term_dates),
    '113': ('Effort dots', sample_effort_dots),
    '114': ('Clubs list', sample_clubs_list),
    '115': ('Status light', sample_status_light),
}

# The two panel sections, and the order they are listed in.
PANELS = {'text.json': TEXT_SAMPLES, 'comp.json': COMP_SAMPLES}
SAMPLES = {**TEXT_SAMPLES, **COMP_SAMPLES}


def main():
    sizes = {}
    for sid_, (title, build) in sorted(SAMPLES.items(), key=lambda kv: int(kv[0])):
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

    for name, panel in PANELS.items():
        items = [{
            'id': int(i), 'cover': f'/covers/sample-{i}.png', 'title': sizes[i][0],
            'width': sizes[i][1], 'height': sizes[i][2], 'state': 1,
        } for i in panel]
        json.dump(items, open(os.path.join(LIST, name), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        print(f'{name}: rewritten')


if __name__ == '__main__':
    main()
