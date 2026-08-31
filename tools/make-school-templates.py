#!/usr/bin/env python3
"""Builds a pack of school templates for the template gallery.

The gallery ships with two placeholder templates from upstream. This adds a
dozen real ones — posters, a certificate, a door sign and two slides — laid out
for a US school on Letter paper and 16:9 slides.

Everything is drawn from assets already in the repo, so the pack adds no new
licensing exposure:

  - shapes and icons from service/src/mock/materials/svg.json
    (18 geometric shapes, plus Lucide icons under ISC)
  - fonts from public/fonts, all Google Fonts under the OFL
  - no photographs, no remote URLs, no network at render time

Every template is recolourable and every string is placeholder copy a school is
meant to overwrite.

    python3 make-school-templates.py            # write the pack
    python3 make-school-templates.py --remove   # take it back out again

Removal is exact: records carry a "pack" marker and ids start at 101, so the
two upstream templates are never touched. Run make-template-covers.mjs
afterwards to generate the thumbnails.

The widget builders below are deliberately a copy of the ones in
make-samples.py rather than a shared import. That script owns the six sample
elements and is not worth destabilising; keeping this one self-contained means
the whole pack is two files you can delete.
"""
import argparse
import json
import os
import uuid as uuidlib

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MOCK = os.path.join(ROOT, 'service', 'src', 'mock')
TEMPLATES = os.path.join(MOCK, 'templates')
SHAPES = os.path.join(MOCK, 'materials', 'svg.json')
COVERS = os.path.join(ROOT, 'public', 'covers')
DIST_COVERS = os.path.join(ROOT, 'dist', 'covers')

PACK = 'school-events'
FIRST_ID = 101

# ------------------------------------------------------------------ palette --
# Collegiate neutrals that print well on a school copier: no gradients, no
# near-blacks, nothing that needs more than a four-colour toner cartridge.
NAVY = '#1E3A5Fff'
NAVY_DEEP = '#152B47ff'
RED = '#C0392Bff'
GOLD = '#E1A731ff'
CREAM = '#FBF7EFff'
WARM = '#FDF3E3ff'
WHITE = '#FFFFFFff'
INK = '#22252Aff'
SLATE = '#5A6472ff'
MIST = '#C9D2DDff'
DUSK = '#8FA0B4ff'
TEAL = '#1F6F6Bff'
PLUM = '#6B3E7Aff'
FOREST = '#2F6B3Aff'

# Tints. Eight-digit hex goes straight into the SVG fill, so a wash is just the
# same colour at low alpha rather than a second swatch to keep in sync.
NAVY_WASH = '#1E3A5F12'
NAVY_RULE = '#1E3A5F33'
WHITE_WASH = '#FFFFFF14'
WHITE_GHOST = '#FFFFFF1F'
GOLD_GHOST = '#E1A73126'
RED_GHOST = '#FFFFFF1C'
GOLD_WASH = '#E1A73133'
SIG_RULE = '#22252A55'

# Page sizes: Letter at 150dpi, and a 16:9 slide.
LETTER_P = (1275, 1650)
LETTER_L = (1650, 1275)
SLIDE = (1920, 1080)


def font(name, file):
    return {'alias': name, 'id': 0, 'value': name, 'url': f'/fonts/{file}'}


ANTON = font('Anton', 'anton-400.woff2')
BEBAS = font('Bebas Neue', 'bebas-neue-400.woff2')
OSWALD = font('Oswald', 'oswald-400-700.woff2')
FREDOKA = font('Fredoka', 'fredoka-400-700.woff2')
ARCHIVO = font('Archivo', 'archivo-400-700.woff2')
INTER = font('Inter', 'inter-400-700.woff2')
MERRIWEATHER = font('Merriweather', 'merriweather-400-700.woff2')
PLAYFAIR = font('Playfair Display', 'playfair-display-400-700.woff2')
CAVEAT = font('Caveat', 'caveat-400-700.woff2')

sid = lambda: uuidlib.uuid4().hex[:12]

_shapes = None


def load_shape(title):
    """Pulls a shape's markup out of the element library."""
    global _shapes
    if _shapes is None:
        _shapes = json.load(open(SHAPES, encoding='utf-8'))
    for item in _shapes:
        if item['title'].lower() == title.lower():
            return item
    raise SystemExit(f'shape not found: {title}')


# ------------------------------------------------------------------ widgets --

def text(body, *, font_, size, colour=INK, weight=400, align='center',
         left, top, width, height=None, line_height=1.2, spacing=0):
    """A text layer. `body` may contain <br/> for a line break.

    Text is stored raw, the way the upstream templates store it, rather than
    percent-encoded the way the sample *elements* do. The two are loaded by
    different code paths: picking a template in the gallery runs it through
    setTemplate, which decodes, but opening one by ?tempid= lands in
    setDWidgets, which does not. Raw survives both — decoding raw text is a
    no-op. The catch is that a literal '%' would then make the gallery's
    decodeURIComponent throw, so refuse to build one.
    """
    if '%' in body:
        raise SystemExit(f"template copy cannot contain '%': {body!r}")
    return {
        'name': 'Text', 'type': 'w-text', 'uuid': sid(), 'editable': False,
        'left': left, 'top': top, 'transform': '',
        'lineHeight': line_height, 'letterSpacing': spacing,
        'fontSize': size, 'fontClass': dict(font_), 'fontFamily': font_['value'],
        'fontWeight': weight, 'fontStyle': 'normal', 'writingMode': 'horizontal-tb',
        'textDecoration': 'none', 'color': colour,
        'textAlign': align, 'text': body,
        'opacity': 1, 'backgroundColor': '', 'parent': '-1',
        'record': {'width': 0, 'height': 0, 'minWidth': 0, 'minHeight': 0, 'dir': 'horizontal'},
        'width': width,
        'height': height or int(size * line_height * (body.count('<br/>') + 1)),
        'rotate': 0, 'imgUrl': '',
        'filter': {'contrast': 0, 'sharpness': 0, 'hueRotate': 0, 'saturate': 0,
                   'brightness': 0, 'gaussianBlur': 0, 'temperature': 0, 'tint': 0},
    }


def shape(title, *, colour, left, top, width, height):
    """A shape or icon layer, recoloured to `colour`."""
    return {
        'name': 'Shape', 'type': 'w-svg', 'uuid': sid(),
        'width': width, 'height': height, 'colors': [colour],
        'left': left, 'top': top, 'transform': '', 'radius': 0, 'opacity': 1,
        'parent': '-1', 'svgUrl': load_shape(title)['url'], 'setting': [],
        'record': {'width': 0, 'height': 0, 'minWidth': 10, 'minHeight': 10},
    }


def band(colour, *, top, height, page_width):
    return shape('Rectangle', colour=colour, left=0, top=top, width=page_width, height=height)


def rule(colour, *, left, top, width, height=12):
    return shape('Line', colour=colour, left=left, top=top, width=width, height=height)


def rounded_rect(colour, *, left, top, width, height, radius):
    """A rounded rectangle whose corners stay round at any aspect ratio.

    The library's Rounded rectangle is a 200x200 viewBox drawn with
    preserveAspectRatio="none", so stretching it to a wide panel shears the
    corner radius into an ellipse. A widget's svgUrl is just markup, so this
    emits the same primitive with the viewBox matching the box it is drawn in.
    """
    markup = (
        '<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {width} {height}" preserveAspectRatio="none">'
        f'<rect x="0" y="0" width="{width}" height="{height}" rx="{radius}" '
        'fill="{{colors[0]}}"/></svg>'
    )
    return {
        'name': 'Shape', 'type': 'w-svg', 'uuid': sid(),
        'width': width, 'height': height, 'colors': [colour],
        'left': left, 'top': top, 'transform': '', 'radius': 0, 'opacity': 1,
        'parent': '-1', 'svgUrl': markup, 'setting': [],
        'record': {'width': 0, 'height': 0, 'minWidth': 10, 'minHeight': 10},
    }


def panel(colour, *, left, top, width, height, radius=32):
    return rounded_rect(colour, left=left, top=top, width=width, height=height, radius=radius)


def pill(colour, *, left, top, width, height):
    return rounded_rect(colour, left=left, top=top, width=width, height=height,
                        radius=height // 2)


def centred_rule(colour, *, top, width, page_width, height=12):
    return rule(colour, left=(page_width - width) // 2, top=top, width=width, height=height)


def bullet_row(icon, label, detail, *, colour, left, top, width,
               icon_size=64, gap=32, label_size=42, detail_size=None):
    """An icon with a line of text beside it, vertically centred on the icon."""
    text_left = left + icon_size + gap
    rows = [
        shape(icon, colour=colour, left=left, top=top, width=icon_size, height=icon_size),
        text(label, font_=INTER, size=label_size, colour=INK, align='left',
             left=text_left, top=top + (icon_size - label_size * 1.2) / 2,
             width=width - (icon_size + gap), height=int(label_size * 1.3)),
    ]
    if detail:
        rows.append(text(detail, font_=INTER, size=detail_size or 34, colour=SLATE, align='left',
                         left=text_left, top=top + icon_size + 6,
                         width=width - (icon_size + gap)))
    return rows


def footer(name, *, colour, page_width, top, align='center', size=44, left=None, width=None):
    left = left if left is not None else 87
    width = width if width is not None else page_width - left * 2
    return text(name, font_=BEBAS, size=size, colour=colour, align=align,
                left=left, top=top, width=width, height=int(size * 1.3), spacing=6)


# ---------------------------------------------------------------- templates --
# Each builder returns (title, (width, height), background, layers). Layers are
# painted in array order, so washes and watermarks go first.

def field_day():
    w, h = LETTER_P
    return 'Field Day poster', (w, h), CREAM, [
        band(NAVY, top=0, height=430, page_width=w),
        shape('trophy', colour=WHITE, left=562, top=60, width=150, height=150),
        text('FIELD DAY', font_=ANTON, size=140, colour=WHITE, left=87, top=232,
             width=1101, height=170, spacing=2),
        text('Friday, May 15', font_=ARCHIVO, size=66, weight=700, colour=NAVY,
             left=137, top=520, width=1001, height=90),
        centred_rule(GOLD, top=650, width=300, page_width=w),
        text('9:00 AM – 2:00 PM  ·  Lower Field', font_=INTER, size=44, colour=INK,
             left=137, top=712, width=1001, height=60),
        panel(NAVY_WASH, left=137, top=870, width=1001, height=460),
        *bullet_row('users', 'Grades K–5, all four houses', None,
                    colour=NAVY, left=207, top=930, width=891, icon_size=72),
        *bullet_row('utensils', 'Lunch served on the field', None,
                    colour=NAVY, left=207, top=1064, width=891, icon_size=72),
        *bullet_row('sun', 'Sunscreen and a water bottle', None,
                    colour=NAVY, left=207, top=1198, width=891, icon_size=72),
        text('Parent volunteers welcome — sign up at the front office.',
             font_=INTER, size=36, colour=SLATE, left=137, top=1400,
             width=1001, height=52),
        band(NAVY, top=1490, height=160, page_width=w),
        footer('SPRINGFIELD ELEMENTARY', colour=WHITE, page_width=w, top=1548, size=56),
    ]


def open_house():
    w, h = LETTER_P
    return 'Open House flyer', (w, h), NAVY, [
        panel(CREAM, left=90, top=90, width=1095, height=1470),
        shape('school', colour=NAVY, left=577, top=180, width=120, height=120),
        text('OPEN HOUSE', font_=OSWALD, size=116, weight=700, colour=NAVY,
             left=150, top=350, width=975, height=150, spacing=4),
        centred_rule(GOLD, top=530, width=300, page_width=w),
        text('Come see the classrooms,<br/>meet the teachers, and<br/>ask us anything.',
             font_=MERRIWEATHER, size=48, colour=INK, left=190, top=600,
             width=895, height=250, line_height=1.5),
        text('Thursday, September 18', font_=ARCHIVO, size=62, weight=700, colour=RED,
             left=150, top=900, width=975, height=84),
        text('6:00 – 8:00 PM', font_=ARCHIVO, size=52, colour=INK,
             left=150, top=1000, width=975, height=70),
        centred_rule(NAVY_RULE, top=1110, width=300, page_width=w, height=8),
        text('Main Building · enter by the gym doors<br/>Refreshments in the cafeteria',
             font_=INTER, size=38, colour=SLATE, left=190, top=1180,
             width=895, height=120, line_height=1.5),
        footer('SPRINGFIELD ELEMENTARY', colour=NAVY, page_width=w, top=1420, size=44),
    ]


def conferences():
    w, h = LETTER_P
    return 'Parent–teacher conferences', (w, h), CREAM, [
        band(TEAL, top=0, height=26, page_width=w),
        band(TEAL, top=1624, height=26, page_width=w),
        shape('calendar days', colour=TEAL, left=100, top=140, width=110, height=110),
        text('Parent–Teacher<br/>Conferences', font_=PLAYFAIR, size=104, weight=700,
             colour=INK, align='left', left=100, top=310, width=1075, height=280,
             line_height=1.25),
        rule(TEAL, left=100, top=630, width=240),
        text('Sign up for a 15-minute slot', font_=INTER, size=46, colour=SLATE,
             align='left', left=100, top=700, width=1075, height=64),
        panel(WHITE, left=100, top=810, width=1075, height=520),
        *bullet_row('clock', 'Tuesday 10/14  ·  3:30 – 7:00 PM', None,
                    colour=TEAL, left=160, top=870, width=955),
        *bullet_row('clock', 'Wednesday 10/15  ·  3:30 – 7:00 PM', None,
                    colour=TEAL, left=160, top=970, width=955),
        *bullet_row('map pin', "Your child's classroom", None,
                    colour=TEAL, left=160, top=1070, width=955),
        *bullet_row('mail', 'office@springfield.k12.us', None,
                    colour=TEAL, left=160, top=1170, width=955),
        text('Slots fill quickly — please book by Friday 10/10.', font_=INTER,
             size=38, colour=SLATE, align='left', left=100, top=1410,
             width=1075, height=60),
        footer('SPRINGFIELD MIDDLE SCHOOL', colour=TEAL, page_width=w, top=1500,
               size=42, align='left', left=100, width=1075),
    ]


def book_fair():
    w, h = LETTER_P
    return 'Book Fair poster', (w, h), RED, [
        shape('book open', colour=RED_GHOST, left=287, top=600, width=700, height=700),
        text('BOOK<br/>FAIR', font_=ANTON, size=210, colour=WHITE, left=87, top=250,
             width=1101, height=520, line_height=1.05, spacing=4),
        centred_rule(GOLD, top=850, width=200, page_width=w, height=14),
        text('November 3–7', font_=ARCHIVO, size=72, weight=700, colour=GOLD,
             left=137, top=930, width=1001, height=96),
        text('Library  ·  Open 8:00 AM – 4:00 PM<br/>Family night Thursday until 7:00 PM',
             font_=INTER, size=42, colour=WHITE, left=137, top=1070,
             width=1001, height=130, line_height=1.5),
        pill(GOLD, left=237, top=1290, width=801, height=120),
        text('EVERY BOOK BUILDS OUR LIBRARY', font_=BEBAS, size=44, colour=NAVY,
             left=257, top=1324, width=761, height=56, spacing=3),
        footer('SPRINGFIELD ELEMENTARY', colour=WHITE, page_width=w, top=1500),
    ]


def picture_day():
    w, h = LETTER_P
    return 'Picture Day notice', (w, h), CREAM, [
        band(PLUM, top=0, height=520, page_width=w),
        shape('camera', colour=WHITE, left=567, top=90, width=140, height=140),
        text('PICTURE DAY', font_=FREDOKA, size=110, weight=700, colour=WHITE,
             left=87, top=290, width=1101, height=150, spacing=2),
        text('Wednesday, October 8', font_=ARCHIVO, size=64, weight=700, colour=PLUM,
             left=137, top=620, width=1001, height=88),
        centred_rule(GOLD, top=750, width=300, page_width=w),
        panel(WHITE, left=137, top=830, width=1001, height=440),
        *bullet_row('check circle', 'Order forms went home Monday', None,
                    colour=PLUM, left=197, top=884, width=891),
        *bullet_row('check circle', 'Wear school colors — no logos', None,
                    colour=PLUM, left=197, top=984, width=891),
        *bullet_row('check circle', 'Retakes on Thursday, November 5', None,
                    colour=PLUM, left=197, top=1084, width=891),
        text('Questions? Call the front office at (555) 010-2200.', font_=INTER,
             size=38, colour=SLATE, left=137, top=1360, width=1001, height=54),
        footer('SPRINGFIELD ELEMENTARY', colour=PLUM, page_width=w, top=1500),
    ]


def spring_concert():
    w, h = LETTER_P
    return 'Spring Concert programme', (w, h), NAVY_DEEP, [
        shape('music', colour=GOLD_GHOST, left=337, top=500, width=600, height=600),
        text('The Spring Concert', font_=PLAYFAIR, size=118, weight=700, colour=WHITE,
             left=87, top=290, width=1101, height=160),
        centred_rule(GOLD, top=500, width=200, page_width=w, height=10),
        text('Chorus  ·  Band  ·  Strings', font_=MERRIWEATHER, size=52, colour=MIST,
             left=137, top=580, width=1001, height=72),
        text('Friday, April 24  ·  7:00 PM', font_=ARCHIVO, size=60, weight=700,
             colour=GOLD, left=137, top=880, width=1001, height=80),
        text('Springfield High School Auditorium<br/>Doors open at 6:30 PM · free admission',
             font_=INTER, size=40, colour=MIST, left=137, top=1010,
             width=1001, height=130, line_height=1.5),
        panel(WHITE_WASH, left=237, top=1230, width=801, height=180),
        text('Reception in the commons<br/>following the performance',
             font_=MERRIWEATHER, size=38, colour=WHITE, left=277, top=1276,
             width=721, height=110, line_height=1.5),
        footer('SPRINGFIELD HIGH SCHOOL', colour=GOLD, page_width=w, top=1500, size=42),
    ]


def science_fair():
    w, h = LETTER_P
    cols = [(137, 259, 304), (471, 593, 638), (804, 926, 971)]  # left, icon left, centre
    columns = []
    entries = [
        ('flask conical', 'EXPERIMENT', 'Any question<br/>you can test'),
        ('clipboard list', 'RECORD', 'Notes, photos,<br/>the numbers'),
        ('medal', 'PRESENT', 'Trifold board,<br/>three minutes'),
    ]
    for (left, icon_left, _), (icon, label, detail) in zip(cols, entries):
        columns += [
            shape(icon, colour=FOREST, left=icon_left, top=560, width=90, height=90),
            text(label, font_=BEBAS, size=44, colour=INK, left=left, top=690,
                 width=334, height=56, spacing=3),
            text(detail, font_=INTER, size=32, colour=SLATE, left=left, top=760,
                 width=334, height=96, line_height=1.45),
        ]
    return 'Science Fair poster', (w, h), CREAM, [
        band(FOREST, top=0, height=340, page_width=w),
        text('SCIENCE FAIR', font_=OSWALD, size=112, weight=700, colour=WHITE,
             left=87, top=110, width=1101, height=140, spacing=3),
        text('Ask a question. Test it. Show us.', font_=MERRIWEATHER, size=46,
             colour=FOREST, left=137, top=420, width=1001, height=64),
        *columns,
        panel(WHITE, left=137, top=900, width=1001, height=360),
        text('KEY DATES', font_=BEBAS, size=44, colour=FOREST, align='left',
             left=197, top=945, width=881, height=56, spacing=4),
        text('Sign up by Friday, February 6', font_=INTER, size=40, colour=INK,
             align='left', left=197, top=1025, width=881, height=54),
        text('Boards due Monday, March 2 · 8:00 AM', font_=INTER, size=40, colour=INK,
             align='left', left=197, top=1095, width=881, height=54),
        text('Judging Tuesday, March 3 · gymnasium', font_=INTER, size=40, colour=INK,
             align='left', left=197, top=1165, width=881, height=54),
        text('Rules and forms: springfield.k12.us/sciencefair', font_=INTER,
             size=36, colour=SLATE, left=137, top=1390, width=1001, height=52),
        band(FOREST, top=1520, height=130, page_width=w),
        footer('SPRINGFIELD MIDDLE SCHOOL', colour=WHITE, page_width=w, top=1560, size=46),
    ]


def bake_sale():
    w, h = LETTER_P
    return 'Bake sale fundraiser', (w, h), WARM, [
        shape('Circle', colour=GOLD_WASH, left=795, top=60, width=420, height=420),
        shape('party popper', colour=RED, left=100, top=120, width=150, height=150),
        text('Bake Sale', font_=FREDOKA, size=150, weight=700, colour=RED,
             align='left', left=100, top=330, width=1075, height=190),
        text('for the 5th grade trip', font_=CAVEAT, size=88, colour=INK,
             align='left', left=100, top=530, width=1075, height=120),
        rule(RED, left=100, top=700, width=240),
        text('Saturday, March 14<br/>9:00 AM – 1:00 PM', font_=ARCHIVO, size=62,
             weight=700, colour=INK, align='left', left=100, top=770,
             width=1075, height=180, line_height=1.4),
        text('School cafeteria  ·  cash and cards welcome', font_=INTER, size=40,
             colour=SLATE, align='left', left=100, top=985, width=1075, height=56),
        panel(WHITE, left=100, top=1090, width=1075, height=300),
        text('Bring a tray, take a treat', font_=FREDOKA, size=56, weight=700,
             colour=RED, align='left', left=160, top=1145, width=955, height=72),
        text('Sign up to bake at the front office, or just come hungry.<br/>Every dollar goes to the trip.',
             font_=INTER, size=36, colour=INK, align='left', left=160, top=1240,
             width=955, height=110, line_height=1.5),
        footer('SPRINGFIELD ELEMENTARY PTA', colour=RED, page_width=w, top=1480,
               size=42, align='left', left=100, width=1075),
    ]


def certificate():
    w, h = LETTER_L
    return 'Certificate of achievement', (w, h), CREAM, [
        # A double border, built from stacked rectangles. The library's Frame
        # shape stretches its stroke with the box, so on a landscape page it
        # comes out thicker on the sides than the top.
        shape('Rectangle', colour=NAVY, left=60, top=60, width=1530, height=1155),
        shape('Rectangle', colour=CREAM, left=76, top=76, width=1498, height=1123),
        shape('Rectangle', colour=GOLD, left=100, top=100, width=1450, height=1075),
        shape('Rectangle', colour=CREAM, left=108, top=108, width=1434, height=1059),
        shape('award', colour=GOLD, left=760, top=160, width=130, height=130),
        text('CERTIFICATE OF ACHIEVEMENT', font_=BEBAS, size=64, colour=NAVY,
             left=225, top=330, width=1200, height=84, spacing=10),
        centred_rule(GOLD, top=440, width=300, page_width=w, height=10),
        text('This certificate is presented to', font_=MERRIWEATHER, size=38,
             colour=SLATE, left=325, top=510, width=1000, height=52),
        text('Student Name', font_=PLAYFAIR, size=110, weight=700, colour=NAVY,
             left=225, top=590, width=1200, height=150),
        centred_rule(NAVY_RULE, top=760, width=800, page_width=w, height=6),
        text('for outstanding effort and kindness<br/>in the third grade',
             font_=MERRIWEATHER, size=42, colour=INK, left=325, top=820,
             width=1000, height=140, line_height=1.5),
        rule(SIG_RULE, left=280, top=1010, width=420, height=5),
        rule(SIG_RULE, left=950, top=1010, width=420, height=5),
        text('Teacher', font_=INTER, size=32, colour=SLATE, left=280, top=1032,
             width=420, height=44),
        text('Principal', font_=INTER, size=32, colour=SLATE, left=950, top=1032,
             width=420, height=44),
        footer('SPRINGFIELD ELEMENTARY', colour=NAVY, page_width=w, top=1110,
               size=38, left=325, width=1000),
    ]


def welcome_sign():
    w, h = LETTER_L
    return 'Classroom door sign', (w, h), NAVY, [
        shape('graduation cap', colour=WHITE_GHOST, left=575, top=300, width=500, height=500),
        band(GOLD, top=0, height=40, page_width=w),
        text('WELCOME', font_=ANTON, size=230, colour=WHITE, left=125, top=250,
             width=1400, height=290, spacing=6),
        text('Room 214  ·  Ms. Alvarez', font_=ARCHIVO, size=84, weight=700,
             colour=GOLD, left=225, top=600, width=1200, height=110),
        centred_rule(GOLD, top=760, width=200, page_width=w),
        text('Grade 7 Language Arts', font_=INTER, size=56, colour=MIST,
             left=225, top=830, width=1200, height=76),
        panel(WHITE_WASH, left=425, top=960, width=800, height=180),
        text('Please sign in at the front office<br/>before visiting classrooms.',
             font_=INTER, size=38, colour=WHITE, left=465, top=1006,
             width=720, height=110, line_height=1.5),
        band(GOLD, top=1235, height=40, page_width=w),
    ]


def slide_title():
    w, h = SLIDE
    return 'Slide — title', (w, h), NAVY, [
        shape('Rectangle', colour=GOLD, left=0, top=0, width=20, height=1080),
        shape('graduation cap', colour=GOLD, left=140, top=140, width=110, height=110),
        text('Back to School Night', font_=PLAYFAIR, size=130, weight=700,
             colour=WHITE, align='left', left=140, top=340, width=1500, height=170),
        rule(GOLD, left=140, top=570, width=240),
        text("What your child's year looks like", font_=INTER, size=56, colour=MIST,
             align='left', left=140, top=650, width=1500, height=76),
        text('Ms. Alvarez · Grade 7 Language Arts<br/>September 18, 2026',
             font_=INTER, size=38, colour=DUSK, align='left', left=140, top=860,
             width=1500, height=110, line_height=1.5),
    ]


def slide_content():
    w, h = SLIDE
    rows = []
    entries = [
        ('book open', 'Reading', 'A book of choice every night, twenty minutes.'),
        ('pencil', 'Writing', 'One draft a week, revised at least twice.'),
        ('users', 'Talking', 'Book clubs on Fridays; the roles rotate.'),
    ]
    for index, (icon, label, detail) in enumerate(entries):
        top = 280 + index * 220
        rows += [
            shape(icon, colour=NAVY, left=100, top=top, width=72, height=72),
            text(label, font_=ARCHIVO, size=52, weight=700, colour=NAVY, align='left',
                 left=210, top=top, width=1600, height=68),
            text(detail, font_=INTER, size=38, colour=INK, align='left',
                 left=210, top=top + 82, width=1600, height=52),
        ]
    return 'Slide — three points', (w, h), WHITE, [
        band(NAVY, top=0, height=140, page_width=w),
        text("How we'll work this year", font_=ARCHIVO, size=62, weight=700,
             colour=WHITE, align='left', left=90, top=38, width=1200, height=84),
        text('Back to School Night', font_=INTER, size=32, colour=DUSK,
             align='right', left=1330, top=52, width=500, height=44),
        *rows,
        rule(GOLD, left=100, top=930, width=240, height=10),
        text('Questions welcome any time — alvarez@springfield.k12.us',
             font_=INTER, size=36, colour=SLATE, align='left', left=100, top=975,
             width=1600, height=52),
    ]


BUILDERS = [
    field_day, open_house, conferences, book_fair, picture_day, spring_concert,
    science_fair, bake_sale, certificate, welcome_sign, slide_title, slide_content,
]


# -------------------------------------------------------------------- write --

def page(title, width, height, background):
    return {
        'name': title, 'type': 'page', 'uuid': '-1', 'left': 0, 'top': 0,
        'width': width, 'height': height, 'backgroundColor': background,
        'backgroundImage': '', 'opacity': 1, 'tag': 0, 'setting': [], 'record': {},
    }


LIST = os.path.join(TEMPLATES, 'list.json')
# Removal restores this byte for byte, so undoing the pack leaves no diff at
# all rather than a reformatted file.
BACKUP = os.path.join(TEMPLATES, f'list.before-{PACK}.json')


def read_list():
    return json.load(open(LIST, encoding='utf-8')) if os.path.exists(LIST) else []


def write_list(items):
    with open(LIST, 'w', encoding='utf-8') as handle:
        json.dump(items, handle, ensure_ascii=False, indent=2)
        handle.write('\n')


def apply():
    if os.path.exists(LIST) and not os.path.exists(BACKUP):
        with open(BACKUP, 'w', encoding='utf-8') as handle:
            handle.write(open(LIST, encoding='utf-8').read())

    entries = []
    for offset, build in enumerate(BUILDERS):
        template_id = FIRST_ID + offset
        title, (width, height), background, layers = build()
        data = [{'global': page(title, width, height, background), 'layers': layers}]
        record = {
            'id': str(template_id), 'title': title, 'width': width, 'height': height,
            'pack': PACK, 'data': json.dumps(data, ensure_ascii=False),
        }
        with open(os.path.join(TEMPLATES, f'{template_id}.json'), 'w', encoding='utf-8') as handle:
            json.dump(record, handle, ensure_ascii=False)
        entries.append({
            'id': template_id, 'cover': f'/covers/template-{template_id}.png',
            'title': title, 'width': width, 'height': height, 'state': 1, 'pack': PACK,
        })
        print(f'  {template_id}.json  {title:<30} {width}x{height}  {len(layers)} layers')

    # The pack goes first; the two upstream placeholders keep their place after it.
    write_list(entries + [item for item in read_list() if item.get('pack') != PACK])
    print(f'\n  list.json: {len(entries)} templates in the "{PACK}" pack')
    print('  Next: node make-template-covers.mjs  (with the app running)')


def remove():
    removed = 0
    for item in read_list():
        if item.get('pack') != PACK:
            continue
        removed += 1
        for path in (os.path.join(TEMPLATES, f"{item['id']}.json"),
                     os.path.join(COVERS, f"template-{item['id']}.png"),
                     os.path.join(DIST_COVERS, f"template-{item['id']}.png")):
            if os.path.exists(path):
                os.remove(path)

    if os.path.exists(BACKUP):
        with open(LIST, 'w', encoding='utf-8') as handle:
            handle.write(open(BACKUP, encoding='utf-8').read())
        os.remove(BACKUP)
        print(f'  removed {removed} templates and their covers; list.json restored')
    else:
        write_list([item for item in read_list() if item.get('pack') != PACK])
        print(f'  removed {removed} templates and their covers; list.json rewritten')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--remove', action='store_true',
                        help='delete the pack and restore list.json')
    remove() if parser.parse_args().remove else apply()
