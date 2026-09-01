#!/usr/bin/env python3
"""Builds five themed slide decks for the template gallery.

The school pack (make-school-templates.py) is one deck in one house style.
This is the other half of the problem: a school that wants the deck to look
like *their* school picks a theme, and gets five slides that already agree with
each other — a cover, the year in numbers, results, facilities, and the year
ahead.

    Editorial   warm paper, Libre Baskerville, a masthead and hairline rules
    Swiss       white, Inter set tight, a red accent and a 12-column grid
    Academic    navy banners, Spectral, white cards on oat
    Dark        near-black, Space Grotesk and JetBrains Mono, one teal accent
    Pastel      cream, Karla with DM Serif Display, rounded cards

Everything is drawn with the widgets the editor already has — text boxes and
inline SVG — so there is nothing to host and nothing to fetch at render time.
The fonts are the bundled Google Fonts under the OFL (see
public/fonts/LICENSES.md); the copy is placeholder text for a fictional school
that whoever uses the template is meant to overwrite.

    python3 make-slide-themes.py            # write the pack
    python3 make-slide-themes.py --remove   # take it back out again

Removal is exact: records carry a "pack" marker and ids start at 201, so no
other pack is touched. Run

    node make-template-covers.mjs --pack=slide-themes

afterwards, with the app running, to shoot the thumbnails.
"""
import argparse
import json
import math
import os
import uuid as uuidlib

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MOCK = os.path.join(ROOT, 'service', 'src', 'mock')
TEMPLATES = os.path.join(MOCK, 'templates')
COVERS = os.path.join(ROOT, 'public', 'covers')
DIST_COVERS = os.path.join(ROOT, 'dist', 'covers')

PACK = 'slide-themes'
FIRST_ID = 201

W, H = 1920, 1080

sid = lambda: uuidlib.uuid4().hex[:12]


def font(name, file):
    return {'alias': name, 'id': 0, 'value': name, 'url': f'/fonts/{file}'}


BASKERVILLE = font('Libre Baskerville', 'libre-baskerville-400-700.woff2')
PLEX_MONO = font('IBM Plex Mono', 'ibm-plex-mono-400.woff2')
INTER = font('Inter', 'inter-400-700.woff2')
ARCHIVO = font('Archivo', 'archivo-400-700.woff2')
SPECTRAL = font('Spectral', 'spectral-400.woff2')
GROTESK = font('Space Grotesk', 'space-grotesk-400-700.woff2')
JETBRAINS = font('JetBrains Mono', 'jetbrains-mono-400-700.woff2')
KARLA = font('Karla', 'karla-400-700.woff2')
DM_SERIF = font('DM Serif Display', 'dm-serif-display-400.woff2')

# Average glyph advance as a fraction of the font size, measured off a line of
# mixed-case English. Only used to guess how many lines a paragraph will take,
# which is what sets the height of its box: nothing reflows around a text
# widget, so the guess only has to be generous enough that the next thing down
# is not sitting on top of it.
ADVANCE = {
    'Libre Baskerville': 0.53, 'IBM Plex Mono': 0.60, 'Inter': 0.51,
    'Archivo': 0.50, 'Spectral': 0.47, 'Space Grotesk': 0.51,
    'JetBrains Mono': 0.60, 'Karla': 0.46, 'DM Serif Display': 0.48,
}


def line_count(body, *, font_, size, width):
    """Greedy word wrap, purely to count the lines the browser will draw."""
    per_char = size * ADVANCE.get(font_['value'], 0.52)
    limit = max(1, int(width / per_char))
    lines = 0
    for paragraph in body.split('<br/>'):
        words, current = paragraph.split(), 0
        lines += 1
        for word in words:
            step = len(word) + (1 if current else 0)
            if current + step > limit and current:
                lines += 1
                current = len(word)
            else:
                current += step
    return lines


# ------------------------------------------------------------------ widgets --

def text(body, *, font_, size, colour, weight=400, align='left', left, top,
         width, height=None, line_height=1.3, spacing=0, italic=False):
    """A text layer.

    `body` may contain <br/> for a hard break. Height is worked out from the
    wrap unless you pass one.

    Two things about the string. It is stored raw rather than percent-encoded,
    because picking a template in the gallery runs it through setTemplate
    (which decodes) but opening one with ?tempid= lands in setDWidgets (which
    does not) — raw survives both. That makes a literal '%' unusable, since it
    would make the gallery's decodeURIComponent throw, so per cents are written
    as the HTML entity instead: the widget renders with v-html, and both
    exports read the text back through the DOM, so it comes out as '%'
    everywhere it is read.
    """
    if height is None:
        # Measure before the entity goes in: '&#37;' is five characters that
        # draw as one, and counting it as five puts a spurious line in the box.
        height = math.ceil(line_count(body, font_=font_, size=size, width=width)
                           * size * line_height)
    body = body.replace('%', '&#37;')
    return {
        'name': 'Text', 'type': 'w-text', 'uuid': sid(), 'editable': False,
        'left': left, 'top': top, 'transform': '',
        'lineHeight': line_height, 'letterSpacing': spacing,
        'fontSize': size, 'fontClass': dict(font_), 'fontFamily': font_['value'],
        'fontWeight': weight, 'fontStyle': 'italic' if italic else 'normal',
        'writingMode': 'horizontal-tb', 'textDecoration': 'none', 'color': colour,
        'textAlign': align, 'text': body,
        'opacity': 1, 'backgroundColor': '', 'parent': '-1',
        'record': {'width': 0, 'height': 0, 'minWidth': 0, 'minHeight': 0, 'dir': 'horizontal'},
        'width': width, 'height': height, 'rotate': 0, 'imgUrl': '',
        'filter': {'contrast': 0, 'sharpness': 0, 'hueRotate': 0, 'saturate': 0,
                   'brightness': 0, 'gaussianBlur': 0, 'temperature': 0, 'tint': 0},
    }


def svg(markup, colours, *, left, top, width, height):
    """A shape layer carrying its own markup.

    Everything here is drawn rather than pulled out of the element library: the
    library's rounded rectangle is a 200x200 viewBox stretched with
    preserveAspectRatio="none", which shears a corner radius into an ellipse on
    a wide panel. Emitting the primitive with the viewBox matching the box it
    is drawn in keeps corners round and hairlines hairline at any size.

    A widget's colours stay editable because the markup refers to them by
    index — {{colors[0]}} — and the widget substitutes on render.
    """
    return {
        'name': 'Shape', 'type': 'w-svg', 'uuid': sid(),
        'width': width, 'height': height, 'colors': list(colours),
        'left': left, 'top': top, 'transform': '', 'radius': 0, 'opacity': 1,
        'parent': '-1', 'svgUrl': markup, 'setting': [],
        'record': {'width': 0, 'height': 0, 'minWidth': 10, 'minHeight': 10},
    }


def _open(width, height):
    return ('<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="0 0 {width} {height}" preserveAspectRatio="none">')


def rect(colour, *, left, top, width, height, radius=0):
    markup = (_open(width, height) +
              f'<rect x="0" y="0" width="{width}" height="{height}" '
              f'rx="{radius}" fill="{{{{colors[0]}}}}"/></svg>')
    return svg(markup, [colour], left=left, top=top, width=width, height=height)


def circle(colour, *, left, top, size):
    return rect(colour, left=left, top=top, width=size, height=size, radius=size // 2)


def hairline(colour, *, left, top, width, thickness=2):
    return rect(colour, left=left, top=top, width=width, height=thickness)


def vline(colour, *, left, top, height, thickness=2):
    return rect(colour, left=left, top=top, width=thickness, height=height)


def hatch(*, left, top, width, height, stripe, fill=None, border=None,
          radius=0, angle=135, step=18, thickness=9):
    """The placeholder a photograph goes into: ruled stripes in a thin frame.

    Drawn as explicit lines rather than an SVG <pattern>, because a pattern
    needs an id and two of these on one slide would then be fighting over the
    same reference.
    """
    colours, body = [stripe], ''
    if fill:
        colours.append(fill)
        body += (f'<rect x="0" y="0" width="{width}" height="{height}" '
                 f'rx="{radius}" fill="{{{{colors[{len(colours) - 1}]}}}}"/>')
    span = width + height
    # 135deg in CSS runs down-left to up-right; -45 in SVG user space is the
    # same line, and stepping the intercept walks it across the box.
    for index in range(-height // step, (span // step) + 1):
        offset = index * step
        if angle == 135:
            x1, y1, x2, y2 = offset, 0, offset + height, height
        else:
            x1, y1, x2, y2 = offset, 0, offset, height
        body += (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                 f'stroke="{{{{colors[0]}}}}" stroke-width="{thickness}"/>')
    if border:
        colours.append(border)
        body += (f'<rect x="1" y="1" width="{width - 2}" height="{height - 2}" '
                 f'rx="{radius}" fill="none" stroke="{{{{colors[{len(colours) - 1}]}}}}" '
                 'stroke-width="2"/>')
    if radius:
        # A unique id per widget: two clipped placeholders on one page would
        # otherwise both resolve to whichever was parsed first.
        clip = f'hatch-{sid()}'
        markup = (_open(width, height) +
                  f'<defs><clipPath id="{clip}"><rect width="{width}" '
                  f'height="{height}" rx="{radius}"/></clipPath></defs>'
                  f'<g clip-path="url(#{clip})">{body}</g></svg>')
    else:
        markup = _open(width, height) + f'<g>{body}</g></svg>'
    return svg(markup, colours, left=left, top=top, width=width, height=height)


def centre_block(widgets, *, top, bottom):
    """Slide a group of widgets so the block they make up sits centred.

    The heights come out of the wrap, so where a hero is centred in a band the
    only honest way to place it is to build it, measure it, and move it.
    """
    span_top = min(widget['top'] for widget in widgets)
    span_bottom = max(widget['top'] + widget['height'] for widget in widgets)
    delta = round(top + (bottom - top - (span_bottom - span_top)) / 2 - span_top)
    for widget in widgets:
        widget['top'] += delta
    return widgets


def head_boxes(edges, span=340, gap=14):
    """Where each column header sits, given the columns under it.

    A label is usually wider than the figures it sits over — "DISTRICT" over
    "67%" — so a header box only as wide as its column wraps. Right-aligned
    headers therefore hang left off the column's right edge, as far as the
    previous column allows and no further, so two of them never collide.
    """
    boxes, previous = [], None
    for x, width, align in edges:
        right = x + width
        if align == 'left':
            boxes.append((x, width))
        else:
            reach = span if previous is None else min(span, right - previous - gap)
            boxes.append((right - reach, reach))
        previous = right
    return boxes


def columns(total, ratios, gap, *, left):
    """Left edge and width of each column of a CSS-style fractional grid."""
    free = total - gap * (len(ratios) - 1)
    share = sum(ratios)
    out, x = [], left
    for ratio in ratios:
        width = round(free * ratio / share)
        out.append((x, width))
        x += width + gap
    return out


# ------------------------------------------------------------------- copy ----
# One fictional school, five decks. Every string here is placeholder text.

SCHOOL = 'Northfield Middle School'
TITLE = 'Annual Report to Families'
PRINCIPAL = 'Dana Whitlock'
MEETING = 'Tuesday, September 15'
MEETING_TIME = '7:00 p.m., Auditorium'
CONTACT_MAIL = 'office@northfieldms.org'
CONTACT_PHONE = '(555) 018-4400'

SECTIONS = ['The Year in Numbers', 'Academic Results', 'Facilities and Safety',
            'The Year Ahead']

RESULTS_HEAD = 'State assessment results, spring 2026'
DATES_HEAD = 'Dates to put on the refrigerator'
PROJECTS_HEAD = 'Four capital projects finished on schedule'
NOTE = ('Proficiency = level 3 or above on the state assessment, administered '
        'April 6–24, 2026. n = 811 tested.')

# grade, reading, math, change, district
SCORES = [
    ('Grade 6', '71%', '64%', '+4', '66%'),
    ('Grade 7', '74%', '68%', '+3', '67%'),
    ('Grade 8', '78%', '70%', '+6', '69%'),
    ('All grades', '74%', '67%', '+4', '67%'),
]

FOCUS = [
    ('Grade 6 math', 'A second daily math block runs Tuesdays and Thursdays from October.'),
    ('Writing', '68% of grade 8 met the district rubric, up from 61%. Not state-reported.'),
    ('Score reports', 'Individual reports are in the parent portal from October 1.'),
]

GRADE_SIZES = [
    ('Grade 6', '301 students · 9 sections'),
    ('Grade 7', '274 students · 8 sections'),
    ('Grade 8', '267 students · 8 sections'),
]

GROWTH = ('Two sixth-grade sections were added in August to absorb growth from '
          'the Belmont Road development, bringing that grade to nine sections.')
STAFFING = ('Staffing kept pace: four classroom teachers, a second counselor, '
            'and a half-time reading specialist shared with Oakridge Elementary.')
MEALS = ('Free and reduced-price meal participation rose to 31% of students. '
         "The district's universal breakfast pilot continues through June 2027.")

# number, caption
STATS = [
    ('842', 'Students enrolled, up 6% from 794 last September.'),
    ('17:1', 'Students per teacher, unchanged for two years.'),
    ('94.2%', 'Average daily attendance, our highest since 2019.'),
    ('38', 'Clubs, teams and after-school programs offered.'),
]
SWISS_STATS = [
    ('842', 'Students, up from 794 in September 2025.'),
    ('+4', 'Classroom teachers hired for the fall term.'),
    ('38', 'Clubs, teams and after-school programs.'),
    ('31%', 'Students in the free and reduced meal program.'),
]
STATS_ALT = [
    ('842', 'Students, up from 794 in September 2025.'),
    ('17:1', 'Students per teacher, unchanged for two years.'),
    ('38', 'Clubs, teams and after-school programs.'),
    ('31%', 'Students in the free and reduced meal program.'),
]
COVER_FACTS = [('Enrollment', '842'), ('Grades', '6–8'), ('Staff', '61'),
               ('Attendance', '94.2%')]

# number, name, what it was, what the picture would be
PROJECTS = [
    ('01', 'Secure entry',
     'Secure entry vestibule and camera upgrade, completed August 8. Cost $184,000, funded by the 2024 bond.',
     'image: entry vestibule'),
    ('02', 'Gymnasium',
     'Gymnasium floor replaced in June. The gym reopened for summer camps two weeks early.',
     'image: gym floor'),
    ('03', 'Cafeteria',
     'Cafeteria seating expanded by 80 places, shortening the third lunch period by nine minutes.',
     'image: cafeteria'),
    ('04', 'Second floor',
     'Two classrooms converted to small-group intervention rooms on the second floor.',
     'image: intervention room'),
]

ENTRY_CAPTION = ('The Belmont Road entrance was rebuilt over the summer as a '
                 'single controlled point of entry. Visitors check in at the '
                 'vestibule window before the interior doors release.')

# short date, long date, what happens
DATES = [
    ('Sept 15', 'September 15', 'Curriculum night, by grade level'),
    ('Oct 3', 'October 3', 'First progress reports posted'),
    ('Nov 12–13', 'November 12–13', 'Parent conferences, sign-up opens Oct 20'),
    ('Jan 20', 'January 20', 'Grade 8 course selection for high school'),
    ('Mar 6', 'March 6', 'Spring assessment window opens'),
    ('Jun 11', 'June 11', 'Grade 8 promotion ceremony'),
]

HELP_HEAD = 'How families can help'
HELP = [
    'Read the Thursday newsletter. It carries every deadline that matters that week.',
    'Volunteer for one event. The library and the spring track meet need the most hands.',
]


# -------------------------------------------------------------- 1 editorial --
# Warm paper, a masthead, hairline rules and a monospaced voice for anything
# that is not prose. Libre Baskerville does the reading.

E_BG = '#FAF7F0ff'
E_INK = '#191713ff'
E_ACCENT = '#8C2F24ff'
E_MUTED = '#6B6355ff'
E_BODY = '#3D382Fff'
E_SOFT = '#4A443Bff'
E_RULE = '#CFC7B6ff'
E_RULE2 = '#D9D2C4ff'
E_RULE3 = '#E3DCCDff'
E_HATCH = '#19171312'
E_PAPER = '#FAF7F0ff'
E_DIM = '#D8CFBCff'

E_LEFT, E_RIGHT, E_TOP = 100, 1820, 90
E_BODY_W = E_RIGHT - E_LEFT


def e_eyebrow(label, number, *, rule=2):
    """The running head every content slide opens with."""
    return [
        text(label.upper(), font_=PLEX_MONO, size=24, colour=E_MUTED, spacing=12,
             left=E_LEFT, top=E_TOP, width=1200, height=30),
        text(number, font_=PLEX_MONO, size=24, colour=E_MUTED, spacing=12,
             align='right', left=E_RIGHT - 300, top=E_TOP, width=300, height=30),
        hairline(E_RULE if rule < 3 else E_INK, left=E_LEFT, top=E_TOP + 46,
                 width=E_BODY_W, thickness=rule),
    ]


def editorial_cover():
    layers = [
        text(SCHOOL.upper(), font_=PLEX_MONO, size=25, colour=E_INK, spacing=12,
             left=E_LEFT, top=E_TOP, width=1000, height=32),
        text('NO. 24 — SEPTEMBER 2026', font_=PLEX_MONO, size=25, colour=E_ACCENT,
             spacing=12, align='right', left=E_RIGHT - 800, top=E_TOP, width=800, height=32),
        hairline(E_INK, left=E_LEFT, top=E_TOP + 50, width=E_BODY_W, thickness=3),
    ]
    (col, col_w), (side, side_w) = columns(E_BODY_W, [1.35, 1], 70, left=E_LEFT)
    top = 187

    heading = text(TITLE, font_=BASKERVILLE, size=104, weight=700, colour=E_INK,
                   line_height=0.98, spacing=-2, left=col, top=top, width=col_w)
    lede = text('A review of the 2025–26 school year, and what our families can '
                'expect in the year ahead.', font_=BASKERVILLE, size=38, italic=True,
                colour=E_SOFT, line_height=1.35, left=col,
                top=heading['top'] + heading['height'] + 34, width=col_w)
    signature = lede['top'] + lede['height'] + 42
    layers += [heading, lede,
               hairline(E_RULE, left=col, top=signature, width=330),
               text(f'{PRINCIPAL}<br/>Principal', font_=PLEX_MONO, size=26,
                    colour=E_INK, line_height=1.6, left=col, top=signature + 14, width=330),
               hairline(E_RULE, left=col + 376, top=signature, width=430),
               text('Tuesday, Sept. 15<br/>7:00 p.m., Auditorium', font_=PLEX_MONO,
                    size=26, colour=E_INK, line_height=1.6, left=col + 376,
                    top=signature + 14, width=430),
               hatch(left=side, top=top, width=side_w, height=720,
                     stripe=E_HATCH, border=E_RULE),
               text('image: front entrance, fall 2026', font_=PLEX_MONO, size=22,
                    colour=E_MUTED, left=side + 22, top=top + 720 - 49, width=side_w - 44, height=30),
               hairline(E_RULE, left=E_LEFT, top=951, width=E_BODY_W),
               text('Enrollment 842 · Grades 6–8 · 1400 Belmont Road · northfieldms.org',
                    font_=PLEX_MONO, size=23, colour=E_MUTED, left=E_LEFT, top=972,
                    width=E_BODY_W, height=32)]
    return 'Editorial slide — cover', E_BG, layers


def editorial_numbers():
    layers = e_eyebrow(SECTIONS[0], '02')
    heading = text('Enrollment grew for a third year while class sizes held steady',
                   font_=BASKERVILLE, size=70, weight=700, colour=E_INK,
                   line_height=1.05, left=E_LEFT, top=178, width=1250)
    layers.append(heading)

    grid = heading['top'] + heading['height'] + 40
    layers.append(hairline(E_INK, left=E_LEFT, top=grid, width=E_BODY_W, thickness=3))
    cell = E_BODY_W // 4
    bottom = grid
    for index, (number, caption) in enumerate(STATS):
        pad_left = 0 if index == 0 else 34
        x = E_LEFT + index * cell + pad_left
        width = cell - pad_left - (0 if index == 3 else 34)
        figure = text(number, font_=BASKERVILLE, size=86, colour=E_ACCENT,
                      line_height=1.0, left=x, top=grid + 37, width=width)
        note = text(caption, font_=BASKERVILLE, size=29, colour=E_INK, line_height=1.4,
                    left=x, top=figure['top'] + figure['height'] + 14, width=width)
        layers += [figure, note]
        bottom = max(bottom, note['top'] + note['height'] + 34)
    for index in range(1, 4):
        layers.append(vline(E_RULE, left=E_LEFT + index * cell, top=grid + 3,
                            height=bottom - grid - 3, thickness=1))

    layers.append(hairline(E_RULE, left=E_LEFT, top=bottom, width=E_BODY_W, thickness=1))
    notes = columns(E_BODY_W, [1, 1, 1], 60, left=E_LEFT)
    for index, (paragraph, (x, width)) in enumerate(zip([GROWTH, STAFFING, MEALS], notes)):
        layers.append(text(paragraph, font_=BASKERVILLE, size=27, colour=E_BODY,
                           line_height=1.55, left=x, top=bottom + 28, width=width))
        if index:
            layers.append(vline(E_RULE3, left=x - 30, top=bottom + 28, height=250, thickness=1))
    return 'Editorial slide — the year in numbers', E_BG, layers


def editorial_results():
    layers = e_eyebrow(SECTIONS[1], '03')
    heading = text(RESULTS_HEAD, font_=BASKERVILLE, size=70, weight=700, colour=E_INK,
                   line_height=1.05, left=E_LEFT, top=178, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 38
    (table, table_w), (aside, aside_w) = columns(E_BODY_W, [1.6, 1], 64, left=E_LEFT)

    # Grade reads left; every number reads right, off a shared right edge.
    heads = ['Grade', 'Reading', 'Math', 'Year change', 'District']
    edges = [(table, 220, 'left'), (table + 300, 180, 'right'), (table + 500, 160, 'right'),
             (table + 660, 200, 'right'), (table + 890, table_w - 890, 'right')]
    for label, (hx, hw), (_x, _width, align) in zip(heads, head_boxes(edges), edges):
        layers.append(text(label.upper(), font_=PLEX_MONO, size=24, colour=E_INK,
                           weight=500, spacing=6, align=align, left=hx, top=top,
                           width=hw, height=30))
    row = top + 44
    layers.append(hairline(E_INK, left=table, top=row, width=table_w, thickness=3))
    row += 3
    for index, score in enumerate(SCORES):
        last = index == len(SCORES) - 1
        weight = 700 if last else 400
        for column_index, (value, (x, width, align)) in enumerate(zip(score, edges)):
            colour = E_INK
            if column_index == 3:
                colour = E_ACCENT
            elif column_index == 4:
                colour = E_MUTED
            layers.append(text(value if column_index != 3 else f'{value} pts',
                               font_=BASKERVILLE, size=28, colour=colour, weight=weight,
                               align=align, left=x, top=row + 22, width=width, height=38))
        row += 82
        if not last:
            layers.append(hairline(E_RULE2, left=table, top=row - 1, width=table_w, thickness=1))
    layers.append(text(NOTE, font_=PLEX_MONO, size=22, colour=E_MUTED, line_height=1.5,
                       left=table, top=row + 24, width=table_w))

    focus_top = top
    body = [text('Where we are focusing', font_=BASKERVILLE, size=32, weight=700,
                 colour=E_INK, left=aside + 34, top=focus_top, width=aside_w - 34)]
    cursor = focus_top + body[0]['height'] + 20
    for paragraph in ['Sixth-grade math remains our weakest result. Beginning in October, '
                      'all grade 6 students receive a second daily math block on Tuesdays '
                      'and Thursdays.',
                      'Writing scores are not reported by the state. Our internal rubric '
                      'shows 68% of eighth graders meeting the district benchmark, up from 61%.',
                      'Families can view an individual score report through the parent '
                      'portal from October 1.']:
        item = text(paragraph, font_=BASKERVILLE, size=27, colour=E_BODY, line_height=1.55,
                    left=aside + 34, top=cursor, width=aside_w - 34)
        body.append(item)
        cursor = item['top'] + item['height'] + 18
    layers.append(vline(E_ACCENT, left=aside, top=focus_top, height=cursor - focus_top - 18,
                        thickness=3))
    layers += body
    return 'Editorial slide — results', E_BG, layers


def editorial_facilities():
    layers = e_eyebrow(SECTIONS[2], '04')
    top = 176
    (col, col_w), (side, side_w) = columns(E_BODY_W, [1.25, 1], 64, left=E_LEFT)
    layers += [
        hatch(left=col, top=top, width=col_w, height=470, stripe=E_HATCH, border=E_RULE),
        text(PROJECTS[0][3], font_=PLEX_MONO, size=22, colour=E_MUTED,
             left=col + 22, top=top + 470 - 49, width=col_w - 44, height=30),
        text(ENTRY_CAPTION, font_=BASKERVILLE, size=26, italic=True, colour=E_SOFT,
             line_height=1.5, left=col, top=top + 492, width=col_w),
    ]
    heading = text(PROJECTS_HEAD, font_=BASKERVILLE, size=62, weight=700, colour=E_INK,
                   line_height=1.05, left=side, top=top, width=side_w)
    layers.append(heading)
    cursor = heading['top'] + heading['height'] + 30
    for number, _name, detail, _image in PROJECTS:
        layers += [
            hairline(E_RULE2, left=side, top=cursor, width=side_w, thickness=1),
            circle(E_ACCENT, left=side, top=cursor + 22, size=54),
            text(number, font_=PLEX_MONO, size=26, colour=E_PAPER, align='center',
                 left=side, top=cursor + 36, width=54, height=34),
        ]
        detail_widget = text(detail, font_=BASKERVILLE, size=28, colour=E_INK,
                             line_height=1.45, left=side + 76, top=cursor + 22,
                             width=side_w - 76)
        layers.append(detail_widget)
        cursor += 22 + max(54, detail_widget['height']) + 22
    return 'Editorial slide — facilities', E_BG, layers


def editorial_year_ahead():
    layers = e_eyebrow(SECTIONS[3], '05')
    heading = text(DATES_HEAD, font_=BASKERVILLE, size=70, weight=700, colour=E_INK,
                   line_height=1.05, left=E_LEFT, top=178, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 38
    (grid, grid_w), (panel, panel_w) = columns(E_BODY_W, [1.5, 1], 64, left=E_LEFT)

    layers.append(hairline(E_INK, left=grid, top=top, width=grid_w, thickness=3))
    cell, row_h = grid_w // 3, 210
    rows = [top + 3, top + 3 + row_h]
    for index, (short, _long, label) in enumerate(DATES):
        column_index, y = index % 3, rows[index // 3]
        pad_left = 0 if column_index == 0 else 26
        x = grid + column_index * cell + pad_left
        width = cell - pad_left - (0 if column_index == 2 else 26)
        layers += [
            text(short, font_=PLEX_MONO, size=24, colour=E_ACCENT, left=x, top=y + 26,
                 width=width, height=30),
            text(label, font_=BASKERVILLE, size=28, colour=E_INK, line_height=1.4,
                 left=x, top=y + 66, width=width, height=118),
        ]
    for y in rows:
        layers.append(hairline(E_RULE2, left=grid, top=y + row_h - 1, width=grid_w, thickness=1))
        for column_index in range(1, 3):
            layers.append(vline(E_RULE2, left=grid + column_index * cell, top=y,
                                height=row_h - 1, thickness=1))

    inner = panel_w - 80
    block = [text(HELP_HEAD, font_=BASKERVILLE, size=34, weight=700, colour=E_PAPER,
                  left=panel + 40, top=top + 40, width=inner)]
    cursor = block[0]['top'] + block[0]['height'] + 20
    for paragraph in HELP:
        item = text(paragraph, font_=BASKERVILLE, size=27, colour=E_PAPER,
                    line_height=1.55, left=panel + 40, top=cursor, width=inner)
        block.append(item)
        cursor = item['top'] + item['height'] + 16
    tail = text(f'Questions: {CONTACT_MAIL} · {CONTACT_PHONE}', font_=BASKERVILLE,
                size=27, colour=E_DIM, line_height=1.55, left=panel + 40, top=cursor,
                width=inner)
    block.append(tail)
    layers.append(rect(E_INK, left=panel, top=top, width=panel_w,
                       height=tail['top'] + tail['height'] + 40 - top))
    layers += block
    return 'Editorial slide — the year ahead', E_BG, layers


# ------------------------------------------------------------------ 2 swiss --
# White, a 12-column grid, one red, and Inter set tight in place of the
# Helvetica the style was born in.

S_BG = '#FFFFFFff'
S_INK = '#101010ff'
S_ACCENT = '#E4322Bff'
S_BODY = '#333333ff'
S_TEXT = '#444444ff'
S_MUTED = '#666666ff'
S_QUIET = '#555555ff'
S_FAINT = '#999999ff'
S_RULE = '#DCDCDCff'
S_RULE_DARK = '#333333ff'
S_RULE_MID = '#444444ff'
S_HATCH = '#10101014'
S_HATCH_LIGHT = '#CCCCCCff'
S_WHITE = '#FFFFFFff'
S_PALE = '#CCCCCCff'
S_BLUSH = '#FFD9D6ff'

S_LEFT, S_RIGHT, S_TOP = 90, 1830, 90
S_BODY_W = S_RIGHT - S_LEFT


def s_eyebrow(number, label, *, colour=S_INK, top=S_TOP):
    return [
        text(number, font_=INTER, size=26, colour=S_ACCENT, spacing=16,
             left=S_LEFT, top=top, width=70, height=34),
        text(label.upper(), font_=INTER, size=26, weight=700, colour=colour,
             spacing=16, left=S_LEFT + 98, top=top, width=1200, height=34),
    ]


def swiss_cover():
    layers = [
        text(SCHOOL.upper(), font_=INTER, size=26, weight=700, colour=S_INK,
             spacing=16, left=S_LEFT, top=43, width=1000, height=34),
        text('2025 / 26', font_=INTER, size=26, colour=S_ACCENT, spacing=16,
             align='right', left=S_RIGHT - 600, top=43, width=600, height=34),
        hairline(S_INK, left=0, top=120, width=W, thickness=1),
        vline(S_RULE, left=1120, top=120, height=760, thickness=1),
    ]
    heading = text('Annual<br/>Report to<br/>Families', font_=INTER, size=118,
                   weight=700, colour=S_INK, line_height=0.92, spacing=-4,
                   left=S_LEFT, top=200, width=970)
    lede = text('The year in review, the results, and the calendar for 2026–27.',
                font_=INTER, size=36, colour=S_TEXT, line_height=1.3,
                left=S_LEFT, top=726, width=780)
    layers += [heading, lede]

    side, side_w = 1180, 650
    layers += [
        hatch(left=side, top=200, width=side_w, height=441, stripe=S_HATCH,
              border=S_INK, angle=90, step=16, thickness=8),
        text('IMAGE: STUDENTS, MAIN CORRIDOR', font_=INTER, size=22, colour=S_MUTED,
             spacing=8, left=side + 20, top=641 - 46, width=side_w - 40, height=30),
        hairline(S_ACCENT, left=side, top=675, width=side_w, thickness=3),
        text(f'{PRINCIPAL}, Principal', font_=INTER, size=28, weight=700, colour=S_INK,
             left=side, top=694, width=side_w, height=42),
        text('Tuesday, September 15 · 7:00 p.m.<br/>Auditorium, doors open 6:30',
             font_=INTER, size=28, colour=S_QUIET, line_height=1.5, left=side,
             top=736, width=side_w),
        hairline(S_INK, left=0, top=880, width=W, thickness=1),
    ]
    cell = S_BODY_W // 4
    for index, (label, value) in enumerate(COVER_FACTS):
        x = S_LEFT + index * cell
        layers += [
            text(label.upper(), font_=INTER, size=24, colour=S_MUTED, spacing=14,
                 left=x, top=920, width=cell - 30, height=30),
            text(value, font_=INTER, size=54, weight=700, colour=S_INK, spacing=-2,
                 left=x, top=956, width=cell - 30, height=70),
        ]
        if index:
            layers.append(vline(S_RULE, left=x - 30, top=920, height=110, thickness=1))
    return 'Swiss slide — cover', S_BG, layers


def swiss_numbers():
    layers = s_eyebrow('02', SECTIONS[0])
    heading = text('Enrollment grew 6% while the student–teacher ratio held at 17:1',
                   font_=INTER, size=76, weight=700, colour=S_INK, line_height=1.0,
                   spacing=-3, left=S_LEFT, top=168, width=1400)
    layers.append(heading)

    grid = heading['top'] + heading['height'] + 44
    layers.append(hairline(S_INK, left=S_LEFT, top=grid, width=S_BODY_W, thickness=3))
    cell = S_BODY_W // 4
    bottom = grid
    for index, (number, caption) in enumerate(SWISS_STATS):
        x = S_LEFT + index * cell + (0 if index == 0 else 32)
        width = cell - (0 if index == 0 else 32) - (0 if index == 3 else 32)
        figure = text(number, font_=INTER, size=96, weight=700,
                      colour=S_ACCENT if index == 1 else S_INK, line_height=1.0,
                      spacing=-4, left=x, top=grid + 35, width=width)
        note = text(caption, font_=INTER, size=27, colour=S_TEXT, line_height=1.4,
                    left=x, top=figure['top'] + figure['height'] + 12, width=width)
        layers += [figure, note]
        bottom = max(bottom, note['top'] + note['height'] + 32)
    for index in range(1, 4):
        layers.append(vline(S_RULE, left=S_LEFT + index * cell, top=grid + 3,
                            height=bottom - grid - 3, thickness=1))
    layers.append(hairline(S_RULE, left=S_LEFT, top=bottom, width=S_BODY_W, thickness=1))

    half = S_BODY_W // 2
    notes = bottom + 30
    cursor = notes
    for paragraph in [GROWTH, STAFFING]:
        item = text(paragraph, font_=INTER, size=28, colour=S_BODY, line_height=1.5,
                    left=S_LEFT, top=cursor, width=half - 32)
        layers.append(item)
        cursor = item['top'] + item['height'] + 18
    layers.append(vline(S_RULE, left=S_LEFT + half, top=notes, height=250, thickness=1))
    for index, (grade, detail) in enumerate(GRADE_SIZES):
        y = notes + index * 62
        layers += [
            text(grade, font_=INTER, size=28, colour=S_INK, left=S_LEFT + half + 32,
                 top=y, width=300, height=38),
            text(detail, font_=INTER, size=28, weight=700, colour=S_INK, align='right',
                 left=S_RIGHT - 600, top=y, width=600, height=38),
        ]
        if index < 2:
            layers.append(hairline(S_RULE, left=S_LEFT + half + 32, top=y + 48,
                                   width=S_BODY_W - half - 32, thickness=1))
    return 'Swiss slide — the year in numbers', S_BG, layers


def swiss_results():
    layers = s_eyebrow('03', SECTIONS[1], colour=S_WHITE)
    heading = text(RESULTS_HEAD, font_=INTER, size=76, weight=700, colour=S_WHITE,
                   line_height=1.0, spacing=-3, left=S_LEFT, top=168, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 40
    (table, table_w), (aside, aside_w) = columns(S_BODY_W, [1.7, 1], 70, left=S_LEFT)

    heads = ['Grade', 'Reading', 'Math', 'Change', 'District']
    edges = [(table, 240, 'left'), (table + 330, 180, 'right'), (table + 530, 170, 'right'),
             (table + 720, 180, 'right'), (table + 930, table_w - 930, 'right')]
    for label, (hx, hw), (_x, _width, align) in zip(heads, head_boxes(edges), edges):
        layers.append(text(label.upper(), font_=INTER, size=24, weight=700, colour=S_WHITE,
                           spacing=12, align=align, left=hx, top=top, width=hw, height=30))
    row = top + 46
    layers.append(hairline(S_WHITE, left=table, top=row, width=table_w, thickness=2))
    row += 2
    for index, score in enumerate(SCORES):
        last = index == len(SCORES) - 1
        for column_index, (value, (x, width, align)) in enumerate(zip(score, edges)):
            colour = S_WHITE
            weight = 700 if last or column_index == 3 else 400
            if column_index == 3:
                colour = S_ACCENT
            elif column_index == 4:
                colour = S_FAINT
            layers.append(text(value, font_=INTER, size=30, colour=colour, weight=weight,
                               align=align, left=x, top=row + 24, width=width, height=40))
        row += 88
        if not last:
            layers.append(hairline(S_RULE_DARK, left=table, top=row - 1, width=table_w,
                                   thickness=1))
    layers.append(text('Proficiency = level 3 or above. Administered April 6–24, 2026. '
                       'n = 811 tested.', font_=INTER, size=24, colour=S_FAINT,
                       line_height=1.5, left=table, top=row + 26, width=table_w))

    cursor = top
    for index, (label, detail) in enumerate(FOCUS):
        layers.append(hairline(S_ACCENT if index == 0 else S_RULE_MID, left=aside,
                               top=cursor, width=aside_w, thickness=3 if index == 0 else 1))
        head = text(label.upper(), font_=INTER, size=26, weight=700, colour=S_WHITE,
                    spacing=12, left=aside, top=cursor + 20, width=aside_w, height=34)
        body = text(detail, font_=INTER, size=27, colour=S_PALE, line_height=1.5,
                    left=aside, top=head['top'] + head['height'] + 12, width=aside_w)
        layers += [head, body]
        cursor = body['top'] + body['height'] + 26
    return 'Swiss slide — results', S_INK, layers


def swiss_facilities():
    layers = s_eyebrow('04', SECTIONS[2])
    heading = text('Four capital projects, all finished on schedule', font_=INTER,
                   size=76, weight=700, colour=S_INK, line_height=1.0, spacing=-3,
                   left=S_LEFT, top=168, width=1600)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 40
    cards = columns(S_BODY_W, [1, 1, 1, 1], 34, left=S_LEFT)
    for (number, name, detail, image), (x, width) in zip(PROJECTS, cards):
        layers += [
            hairline(S_INK, left=x, top=top, width=width, thickness=3),
            hatch(left=x, top=top + 25, width=width, height=260, stripe=S_HATCH,
                  border=S_HATCH_LIGHT, angle=90, step=16, thickness=8),
            text(image.upper(), font_=INTER, size=21, colour=S_MUTED, spacing=6,
                 left=x + 16, top=top + 285 - 44, width=width - 32, height=28),
            text(f'{number} {name}'.upper(), font_=INTER, size=26, weight=700,
                 colour=S_ACCENT, spacing=12, left=x, top=top + 305, width=width, height=34),
            text(detail, font_=INTER, size=27, colour=S_BODY, line_height=1.45,
                 left=x, top=top + 359, width=width),
        ]
    return 'Swiss slide — facilities', S_BG, layers


def swiss_year_ahead():
    layers = s_eyebrow('05', SECTIONS[3])
    heading = text(DATES_HEAD, font_=INTER, size=76, weight=700, colour=S_INK,
                   line_height=1.0, spacing=-3, left=S_LEFT, top=168, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 40
    (grid, grid_w), (panel, panel_w) = columns(S_BODY_W, [1.6, 1], 70, left=S_LEFT)

    layers.append(hairline(S_INK, left=grid, top=top, width=grid_w, thickness=3))
    row = top + 3
    labels = ['Curriculum night, by grade level',
              'First progress reports posted to the portal',
              'Parent conferences, sign-up opens October 20',
              'Grade 8 course selection for high school',
              'Spring assessment window opens',
              'Grade 8 promotion ceremony']
    for index, ((short, _long, _label), detail) in enumerate(zip(DATES, labels)):
        layers += [
            text(short, font_=INTER, size=29, weight=700, colour=S_ACCENT, left=grid,
                 top=row + 22, width=200, height=40),
            text(detail, font_=INTER, size=29, colour=S_INK, left=grid + 230,
                 top=row + 22, width=grid_w - 230, height=40),
        ]
        row += 85
        if index < len(DATES) - 1:
            layers.append(hairline(S_RULE, left=grid, top=row - 1, width=grid_w, thickness=1))

    inner = panel_w - 88
    block = [text(HELP_HEAD, font_=INTER, size=36, weight=700, colour=S_WHITE,
                  spacing=-2, left=panel + 44, top=top + 44, width=inner)]
    cursor = block[0]['top'] + block[0]['height'] + 22
    for paragraph in ['Read the Thursday newsletter. Every deadline that matters is in it.',
                      'Volunteer for one event. The library and the spring track meet '
                      'need the most hands.']:
        item = text(paragraph, font_=INTER, size=28, colour=S_WHITE, line_height=1.5,
                    left=panel + 44, top=cursor, width=inner)
        block.append(item)
        cursor = item['top'] + item['height'] + 18
    tail = text(f'{CONTACT_MAIL}<br/>{CONTACT_PHONE}', font_=INTER, size=26,
                colour=S_BLUSH, line_height=1.5, left=panel + 44, top=cursor, width=inner)
    block.append(tail)
    layers.append(rect(S_ACCENT, left=panel, top=top, width=panel_w,
                       height=tail['top'] + tail['height'] + 44 - top))
    layers += block
    return 'Swiss slide — the year ahead', S_BG, layers


# --------------------------------------------------------------- 3 academic --
# Navy banners over oat paper, Spectral for the reading and Archivo for the
# labels, white cards holding the figures.

A_BG = '#F3F0E9ff'
A_NAVY = '#0F2340ff'
A_INK = '#14263Fff'
A_GOLD = '#CFA93Fff'
A_GOLD_DEEP = '#8A6A12ff'
A_CREAM = '#F3F0E9ff'
A_BODY = '#33405Aff'
A_SOFT = '#46536Aff'
A_MUTED = '#6F7A89ff'
A_PALE = '#CBD5E2ff'
A_SLATE = '#A8B6C8ff'
A_RULE = '#CDC7B8ff'
A_ROW_RULE = '#E0DBD0ff'
A_WHITE = '#FFFFFFff'
A_ALT = '#EAE5D9ff'
A_HATCH = '#14263F14'
A_HATCH_HERO = '#F3F0E91F'

A_LEFT, A_RIGHT = 100, 1820
A_BODY_W = A_RIGHT - A_LEFT
A_BAND = 148


def a_banner(title, section):
    """The navy bar the four content slides open with."""
    return [
        rect(A_NAVY, left=0, top=0, width=W, height=A_BAND),
        text(title, font_=ARCHIVO, size=34, weight=700, colour=A_CREAM, spacing=6,
             left=A_LEFT, top=52, width=1100, height=46),
        text(section.upper(), font_=ARCHIVO, size=26, colour=A_GOLD, spacing=20,
             align='right', left=A_RIGHT - 600, top=58, width=600, height=34),
    ]


def academic_cover():
    hero = 760
    (col, col_w), (side, side_w) = columns(A_BODY_W, [1.3, 1], 70, left=A_LEFT)
    layers = [rect(A_NAVY, left=0, top=0, width=W, height=hero)]

    eyebrow = text(SCHOOL.upper(), font_=ARCHIVO, size=26, colour=A_GOLD, spacing=20,
                   left=col, top=139, width=col_w, height=34)
    heading = text(TITLE, font_=SPECTRAL, size=100, colour=A_CREAM, line_height=1.0,
                   spacing=-2, left=col, top=eyebrow['top'] + 60, width=col_w)
    rule_top = heading['top'] + heading['height'] + 34
    lede = text('A review of the 2025–26 school year, the results behind it, and '
                'the calendar for the year ahead.', font_=SPECTRAL, size=36,
                colour=A_PALE, line_height=1.4, left=col, top=rule_top + 38, width=col_w)
    layers += centre_block(
        [eyebrow, heading, hairline(A_GOLD, left=col, top=rule_top, width=160, thickness=4),
         lede], top=0, bottom=hero)
    layers += [
               hatch(left=side, top=160, width=side_w, height=440, stripe=A_HATCH_HERO,
                     border=A_GOLD),
               text('IMAGE: SCHOOL CREST OR BUILDING', font_=ARCHIVO, size=22,
                    colour=A_SLATE, spacing=6, left=side + 22, top=600 - 52,
                    width=side_w - 44, height=30)]

    facts = [('Presented by', f'{PRINCIPAL}<br/>Principal'),
             ('Meeting', f'{MEETING}<br/>{MEETING_TIME}'),
             ('Enrollment', '842 students<br/>Grades 6–8')]
    for index, ((label, detail), (x, width)) in enumerate(zip(facts, columns(A_BODY_W, [1, 1, 1], 60, left=A_LEFT))):
        inset = 60 if index else 0
        if index:
            layers.append(vline(A_RULE, left=x, top=838, height=164, thickness=1))
        layers += [
            text(label.upper(), font_=ARCHIVO, size=24, colour=A_MUTED, spacing=16,
                 left=x + inset, top=853, width=width - inset, height=30),
            text(detail, font_=SPECTRAL, size=34, colour=A_INK, line_height=1.35,
                 left=x + inset, top=895, width=width - inset),
        ]
    return 'Academic slide — cover', A_BG, layers


def academic_numbers():
    layers = a_banner(SECTIONS[0], 'Section Two')
    heading = text('Enrollment grew for a third year while class sizes held steady',
                   font_=SPECTRAL, size=66, colour=A_INK, line_height=1.08, spacing=-1,
                   left=A_LEFT, top=208, width=1400)
    layers.append(heading)

    top = heading['top'] + heading['height'] + 40
    cards = columns(A_BODY_W, [1, 1, 1, 1], 34, left=A_LEFT)
    # One height for all four cards, taken from the caption that wraps furthest.
    notes = [text(caption, font_=SPECTRAL, size=27, colour=A_SOFT, line_height=1.45,
                  left=x + 32, top=top + 129, width=width - 64)
             for (_number, caption), (x, width) in zip(STATS, cards)]
    card_h = max(note['height'] for note in notes) + 161
    for (number, _caption), (x, width), note in zip(STATS, cards, notes):
        layers += [
            rect(A_WHITE, left=x, top=top, width=width, height=card_h),
            hairline(A_GOLD, left=x, top=top, width=width, thickness=5),
            text(number, font_=SPECTRAL, size=78, colour=A_NAVY, line_height=1.0,
                 left=x + 32, top=top + 37, width=width - 64),
            note,
        ]

    rule = top + card_h + 40
    layers.append(hairline(A_RULE, left=A_LEFT, top=rule, width=A_BODY_W, thickness=1))
    (col, col_w), (side, side_w) = columns(A_BODY_W, [1.15, 1], 70, left=A_LEFT)
    inner = columns(col_w, [1, 1], 50, left=col)
    for paragraph, (x, width) in zip([GROWTH, STAFFING], inner):
        layers.append(text(paragraph, font_=SPECTRAL, size=28, colour=A_BODY,
                           line_height=1.55, left=x, top=rule + 34, width=width))
    for index, (grade, detail) in enumerate(GRADE_SIZES):
        y = rule + 34 + index * 58
        layers += [
            text(grade, font_=SPECTRAL, size=28, colour=A_INK, left=side, top=y,
                 width=300, height=38),
            text(detail, font_=SPECTRAL, size=28, colour=A_INK, align='right',
                 left=side + side_w - 500, top=y, width=500, height=38),
        ]
        if index < 2:
            layers.append(hairline(A_RULE, left=side, top=y + 44, width=side_w, thickness=1))
    return 'Academic slide — the year in numbers', A_BG, layers


def academic_results():
    layers = a_banner(SECTIONS[1], 'Section Three')
    heading = text(RESULTS_HEAD, font_=SPECTRAL, size=66, colour=A_INK,
                   line_height=1.08, spacing=-1, left=A_LEFT, top=208, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 38
    (table, table_w), (aside, aside_w) = columns(A_BODY_W, [1.65, 1], 66, left=A_LEFT)

    head_h, row_h = 65, 79
    table_h = head_h + row_h * len(SCORES)
    layers += [rect(A_WHITE, left=table, top=top, width=table_w, height=table_h),
               rect(A_ALT, left=table, top=top + head_h + row_h * 3, width=table_w, height=row_h),
               rect(A_NAVY, left=table, top=top, width=table_w, height=head_h)]
    edges = [(table + 22, 240, 'left'), (table + 330, 190, 'right'), (table + 530, 140, 'right'),
             (table + 680, 170, 'right'), (table + 880, table_w - 902, 'right')]
    heads = ['Grade', 'Reading', 'Math', 'Change', 'District']
    for label, (hx, hw), (_x, _width, align) in zip(heads, head_boxes(edges), edges):
        layers.append(text(label.upper(), font_=ARCHIVO, size=24, weight=700, colour=A_CREAM,
                           spacing=10, align=align, left=hx, top=top + 18, width=hw, height=32))
    for index, score in enumerate(SCORES):
        y = top + head_h + index * row_h
        last = index == len(SCORES) - 1
        for column_index, (value, (x, width, align)) in enumerate(zip(score, edges)):
            colour = A_INK
            if column_index == 3:
                colour = A_GOLD_DEEP
            elif column_index == 4:
                colour = A_MUTED
            layers.append(text(value if column_index != 3 else f'{value} pts',
                               font_=SPECTRAL, size=29, colour=colour,
                               weight=700 if last else 400, align=align, left=x,
                               top=y + 22, width=width, height=40))
        if not last:
            layers.append(hairline(A_ROW_RULE, left=table, top=y + row_h - 1,
                                   width=table_w, thickness=1))
    layers.append(text(NOTE, font_=SPECTRAL, size=24, colour=A_MUTED, line_height=1.5,
                       left=table, top=top + table_h + 24, width=table_w))

    block = [text('Where we are focusing', font_=SPECTRAL, size=34, colour=A_INK,
                  left=aside + 41, top=top + 36, width=aside_w - 77)]
    cursor = block[0]['top'] + block[0]['height'] + 20
    for paragraph in ['Sixth-grade math is our weakest result. From October, every grade 6 '
                      'student has a second daily math block on Tuesdays and Thursdays.',
                      'Writing is not state-reported. Our own rubric puts 68% of grade 8 '
                      'at benchmark, up from 61%.',
                      'Individual score reports open in the parent portal on October 1.']:
        item = text(paragraph, font_=SPECTRAL, size=27, colour=A_BODY, line_height=1.55,
                    left=aside + 41, top=cursor, width=aside_w - 77)
        block.append(item)
        cursor = item['top'] + item['height'] + 18
    card_h = cursor + 18
    layers += [rect(A_WHITE, left=aside, top=top, width=aside_w, height=card_h - top),
               rect(A_NAVY, left=aside, top=top, width=5, height=card_h - top)]
    layers += block
    return 'Academic slide — results', A_BG, layers


def academic_facilities():
    layers = a_banner(SECTIONS[2], 'Section Four')
    top = 208
    (col, col_w), (side, side_w) = columns(A_BODY_W, [1.1, 1], 66, left=A_LEFT)
    layers += [
        hatch(left=col, top=top, width=col_w, height=480, stripe=A_HATCH, border=A_RULE),
        text(PROJECTS[0][3].upper(), font_=ARCHIVO, size=22, colour=A_MUTED, spacing=6,
             left=col + 22, top=top + 480 - 52, width=col_w - 44, height=30),
        text(ENTRY_CAPTION, font_=SPECTRAL, size=26, colour=A_SOFT, line_height=1.5,
             left=col, top=top + 502, width=col_w),
    ]
    heading = text(PROJECTS_HEAD, font_=SPECTRAL, size=60, colour=A_INK,
                   line_height=1.08, spacing=-1, left=side, top=top, width=side_w)
    layers.append(heading)
    cursor = heading['top'] + heading['height'] + 32
    for number, _name, detail, _image in PROJECTS:
        body = text(detail, font_=SPECTRAL, size=27, colour=A_BODY, line_height=1.5,
                    left=side + 104, top=cursor + 24, width=side_w - 128)
        card_h = max(56, body['height']) + 48
        layers += [
            rect(A_WHITE, left=side, top=cursor, width=side_w, height=card_h),
            rect(A_NAVY, left=side + 24, top=cursor + 24, width=56, height=56),
            text(number, font_=ARCHIVO, size=26, weight=700, colour=A_GOLD, align='center',
                 left=side + 24, top=cursor + 38, width=56, height=34),
            body,
        ]
        cursor += card_h + 20
    return 'Academic slide — facilities', A_BG, layers


def academic_year_ahead():
    layers = a_banner(SECTIONS[3], 'Section Five')
    heading = text(DATES_HEAD, font_=SPECTRAL, size=66, colour=A_INK, line_height=1.08,
                   spacing=-1, left=A_LEFT, top=208, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 38
    (grid, grid_w), (panel, panel_w) = columns(A_BODY_W, [1.55, 1], 66, left=A_LEFT)

    cell_w = (grid_w - 22) // 2
    card_h = 170
    for index, (_short, long, label) in enumerate(DATES):
        x = grid + (index % 2) * (cell_w + 22)
        y = top + (index // 2) * (card_h + 22)
        layers += [
            rect(A_WHITE, left=x, top=y, width=cell_w, height=card_h),
            rect(A_GOLD, left=x, top=y, width=4, height=card_h),
            text(long.upper(), font_=ARCHIVO, size=25, colour=A_GOLD_DEEP, spacing=10,
                 left=x + 30, top=y + 26, width=cell_w - 56, height=32),
            text(label, font_=SPECTRAL, size=28, colour=A_INK, line_height=1.4,
                 left=x + 30, top=y + 68, width=cell_w - 56, height=80),
        ]

    inner = panel_w - 80
    block = [text(HELP_HEAD, font_=SPECTRAL, size=34, colour=A_GOLD, left=panel + 40,
                  top=top + 40, width=inner)]
    cursor = block[0]['top'] + block[0]['height'] + 22
    for paragraph in HELP:
        item = text(paragraph, font_=SPECTRAL, size=27, colour=A_CREAM, line_height=1.55,
                    left=panel + 40, top=cursor, width=inner)
        block.append(item)
        cursor = item['top'] + item['height'] + 18
    tail = text(f'{CONTACT_MAIL} · {CONTACT_PHONE}', font_=SPECTRAL, size=26,
                colour=A_SLATE, line_height=1.55, left=panel + 40, top=cursor, width=inner)
    block.append(tail)
    layers.append(rect(A_NAVY, left=panel, top=top, width=panel_w,
                       height=tail['top'] + tail['height'] + 40 - top))
    layers += block
    return 'Academic slide — the year ahead', A_BG, layers


# ------------------------------------------------------------------- 4 dark --
# Near-black with one teal, Space Grotesk for the voice and JetBrains Mono for
# anything that is really a label.

D_BG = '#0D1012ff'
D_CARD = '#14191Bff'
D_TEXT = '#E9EEEEff'
D_ACCENT = '#46CDB4ff'
D_MUTED = '#9AA8A8ff'
D_FAINT = '#6F7D7Dff'
D_BODY = '#B3C0C0ff'
D_RULE = '#2A3234ff'
D_RULE2 = '#232A2Cff'
D_ON_ACCENT = '#07100Eff'
D_ON_ACCENT_DIM = '#0F3B34ff'
D_HATCH = '#E9EEEE12'

D_LEFT, D_RIGHT = 100, 1820
D_BODY_W = D_RIGHT - D_LEFT


def d_eyebrow(number, label):
    return [
        text(number, font_=JETBRAINS, size=25, colour=D_ACCENT, spacing=10,
             left=D_LEFT, top=90, width=60, height=32),
        hairline(D_RULE, left=D_LEFT + 80, top=105, width=60, thickness=1),
        text(label.upper(), font_=JETBRAINS, size=25, colour=D_MUTED, spacing=10,
             left=D_LEFT + 160, top=90, width=1200, height=32),
    ]


def dark_cover():
    layers = [
        rect(D_ACCENT, left=D_LEFT, top=97, width=18, height=18),
        text(SCHOOL.upper(), font_=JETBRAINS, size=25, colour=D_TEXT, spacing=10,
             left=D_LEFT + 36, top=90, width=1000, height=32),
        text('2025 / 26', font_=JETBRAINS, size=25, colour=D_ACCENT, spacing=10,
             align='right', left=D_RIGHT - 500, top=90, width=500, height=32),
    ]
    (col, col_w), (side, side_w) = columns(D_BODY_W, [1.4, 1], 70, left=D_LEFT)
    heading = text(TITLE, font_=GROTESK, size=112, weight=700, colour=D_TEXT,
                   line_height=0.95, spacing=-4, left=col, top=275, width=col_w)
    lede = text('A review of the 2025–26 school year, the results behind it, and '
                'the calendar for the year ahead.', font_=GROTESK, size=36,
                colour=D_MUTED, line_height=1.4, left=col,
                top=heading['top'] + heading['height'] + 34, width=col_w)
    layers += centre_block([heading, lede], top=172, bottom=777)
    layers += [hatch(left=side, top=244, width=side_w, height=460, stripe=D_HATCH,
                     fill=D_CARD, border=D_RULE),
               text('image: students, main corridor', font_=JETBRAINS, size=22,
                    colour=D_FAINT, left=side + 22, top=704 - 52, width=side_w - 44,
                    height=30)]

    cards = columns(D_BODY_W, [1, 1, 1, 1], 28, left=D_LEFT)
    facts = [('Enrollment', '842'), ('Staff', '61'), ('Attendance', '94.2%')]
    for index, ((label, value), (x, width)) in enumerate(zip(facts, cards)):
        layers += [
            rect(D_CARD, left=x, top=827, width=width, height=173),
            hairline(D_ACCENT if index == 0 else D_RULE, left=x, top=827, width=width,
                     thickness=3),
            text(label.upper(), font_=JETBRAINS, size=23, colour=D_FAINT, spacing=8,
                 left=x + 28, top=853, width=width - 56, height=30),
            text(value, font_=GROTESK, size=52, weight=700, colour=D_TEXT, spacing=-2,
                 left=x + 28, top=891, width=width - 56, height=70),
        ]
    speaker_x, speaker_w = cards[3]
    layers += [
        rect(D_CARD, left=speaker_x, top=827, width=speaker_w, height=173),
        hairline(D_RULE, left=speaker_x, top=827, width=speaker_w, thickness=3),
        text('SPEAKER', font_=JETBRAINS, size=23, colour=D_FAINT, spacing=8,
             left=speaker_x + 28, top=853, width=speaker_w - 56, height=30),
        text(PRINCIPAL, font_=GROTESK, size=32, weight=700, colour=D_TEXT,
             left=speaker_x + 28, top=891, width=speaker_w - 56, height=42),
        text('Principal', font_=GROTESK, size=32, colour=D_FAINT,
             left=speaker_x + 28, top=933, width=speaker_w - 56, height=42),
    ]
    return 'Dark slide — cover', D_BG, layers


def dark_numbers():
    layers = d_eyebrow('02', SECTIONS[0])
    heading = text('Enrollment grew 6% while the student–teacher ratio held at 17:1',
                   font_=GROTESK, size=72, weight=700, colour=D_TEXT, line_height=1.02,
                   spacing=-3, left=D_LEFT, top=164, width=1400)
    layers.append(heading)

    top = heading['top'] + heading['height'] + 42
    cards = columns(D_BODY_W, [1, 1, 1, 1], 28, left=D_LEFT)
    notes = [text(caption, font_=GROTESK, size=27, colour=D_MUTED, line_height=1.45,
                  left=x + 32, top=top + 126, width=width - 64)
             for (_number, caption), (x, width) in zip(STATS_ALT, cards)]
    card_h = max(note['height'] for note in notes) + 158
    for (number, _caption), (x, width), note in zip(STATS_ALT, cards, notes):
        layers += [
            rect(D_CARD, left=x, top=top, width=width, height=card_h),
            rect(D_ACCENT, left=x, top=top, width=3, height=card_h),
            text(number, font_=GROTESK, size=82, weight=700, colour=D_TEXT,
                 line_height=1.0, spacing=-4, left=x + 32, top=top + 32, width=width - 64),
            note,
        ]

    band = top + card_h + 28
    left_w = cards[1][0] + cards[1][1] - D_LEFT
    for paragraph, (x, width) in zip([GROWTH, STAFFING], columns(left_w, [1, 1], 40, left=D_LEFT)):
        layers.append(text(paragraph, font_=GROTESK, size=27, colour=D_BODY,
                           line_height=1.55, left=x, top=band + 12, width=width))
    side, side_w = cards[2][0], D_RIGHT - cards[2][0]
    for index, (grade, detail) in enumerate(GRADE_SIZES):
        y = band + 12 + index * 62
        layers += [
            text(grade, font_=GROTESK, size=28, colour=D_MUTED, left=side, top=y,
                 width=300, height=38),
            text(detail, font_=GROTESK, size=28, colour=D_TEXT, align='right',
                 left=side + side_w - 500, top=y, width=500, height=38),
        ]
        if index < 2:
            layers.append(hairline(D_RULE2, left=side, top=y + 48, width=side_w, thickness=1))
    return 'Dark slide — the year in numbers', D_BG, layers


def dark_results():
    layers = d_eyebrow('03', SECTIONS[1])
    heading = text(RESULTS_HEAD, font_=GROTESK, size=72, weight=700, colour=D_TEXT,
                   line_height=1.02, spacing=-3, left=D_LEFT, top=164, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 40
    (table, table_w), (aside, aside_w) = columns(D_BODY_W, [1.7, 1], 66, left=D_LEFT)

    heads = ['Grade', 'Reading', 'Math', 'Change', 'District']
    edges = [(table, 240, 'left'), (table + 320, 180, 'right'), (table + 520, 160, 'right'),
             (table + 690, 190, 'right'), (table + 910, table_w - 910, 'right')]
    for label, (hx, hw), (_x, _width, align) in zip(heads, head_boxes(edges), edges):
        layers.append(text(label.upper(), font_=JETBRAINS, size=23, colour=D_MUTED,
                           spacing=8, align=align, left=hx, top=top, width=hw, height=30))
    row = top + 46
    layers.append(hairline(D_ACCENT, left=table, top=row, width=table_w, thickness=2))
    row += 2
    for index, score in enumerate(SCORES):
        last = index == len(SCORES) - 1
        for column_index, (value, (x, width, align)) in enumerate(zip(score, edges)):
            colour = D_TEXT
            if column_index == 3:
                colour = D_ACCENT
            elif column_index == 4:
                colour = D_FAINT
            layers.append(text(value if column_index != 3 else f'{value} pts',
                               font_=GROTESK, size=29, colour=colour,
                               weight=700 if last else 400, align=align, left=x,
                               top=row + 24, width=width, height=40))
        row += 88
        if not last:
            layers.append(hairline(D_RULE2, left=table, top=row - 1, width=table_w,
                                   thickness=1))
    layers.append(text(NOTE, font_=JETBRAINS, size=22, colour=D_FAINT, line_height=1.5,
                       left=table, top=row + 26, width=table_w))

    cursor = top
    for label, detail in FOCUS:
        head = text(label.upper(), font_=JETBRAINS, size=23, colour=D_ACCENT, spacing=8,
                    left=aside + 30, top=cursor + 30, width=aside_w - 60, height=30)
        body = text(detail, font_=GROTESK, size=27, colour=D_BODY, line_height=1.5,
                    left=aside + 30, top=head['top'] + 44, width=aside_w - 60)
        card_h = body['top'] + body['height'] + 30 - cursor
        layers += [rect(D_CARD, left=aside, top=cursor, width=aside_w, height=card_h),
                   head, body]
        cursor += card_h + 26
    return 'Dark slide — results', D_BG, layers


def dark_facilities():
    layers = d_eyebrow('04', SECTIONS[2])
    heading = text('Four capital projects, all finished on schedule', font_=GROTESK,
                   size=72, weight=700, colour=D_TEXT, line_height=1.02, spacing=-3,
                   left=D_LEFT, top=164, width=1600)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 40
    cards = columns(D_BODY_W, [1, 1, 1, 1], 28, left=D_LEFT)
    bodies = [text(detail, font_=GROTESK, size=26, colour=D_BODY, line_height=1.45,
                   left=x + 26, top=top + 340, width=width - 52)
              for (_number, _name, detail, _image), (x, width) in zip(PROJECTS, cards)]
    card_h = max(body['height'] for body in bodies) + 366
    for (number, name, _detail, image), (x, width), body in zip(PROJECTS, cards, bodies):
        layers += [
            rect(D_CARD, left=x, top=top, width=width, height=card_h),
            hatch(left=x, top=top, width=width, height=250, stripe=D_HATCH),
            hairline(D_RULE, left=x, top=top + 250, width=width, thickness=1),
            text(image, font_=JETBRAINS, size=21, colour=D_FAINT, left=x + 16,
                 top=top + 250 - 44, width=width - 32, height=28),
            text(f'{number} {name}'.upper(), font_=JETBRAINS, size=23, colour=D_ACCENT,
                 spacing=8, left=x + 26, top=top + 288, width=width - 52, height=30),
            body,
        ]
    return 'Dark slide — facilities', D_BG, layers


def dark_year_ahead():
    layers = d_eyebrow('05', SECTIONS[3])
    heading = text(DATES_HEAD, font_=GROTESK, size=72, weight=700, colour=D_TEXT,
                   line_height=1.02, spacing=-3, left=D_LEFT, top=164, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 40
    (grid, grid_w), (panel, panel_w) = columns(D_BODY_W, [1.6, 1], 66, left=D_LEFT)

    labels = ['Curriculum night, by grade level',
              'First progress reports posted to the portal',
              'Parent conferences, sign-up opens October 20',
              'Grade 8 course selection for high school',
              'Spring assessment window opens',
              'Grade 8 promotion ceremony']
    row = top
    for index, ((short, _long, _label), detail) in enumerate(zip(DATES, labels)):
        layers += [
            text(short, font_=JETBRAINS, size=25, colour=D_ACCENT, left=grid,
                 top=row + 22, width=230, height=34),
            text(detail, font_=GROTESK, size=29, colour=D_TEXT, left=grid + 250,
                 top=row + 20, width=grid_w - 250, height=40),
        ]
        row += 79
        if index < len(DATES) - 1:
            layers.append(hairline(D_RULE2, left=grid, top=row - 1, width=grid_w,
                                   thickness=1))

    inner = panel_w - 80
    block = [text(HELP_HEAD, font_=GROTESK, size=36, weight=700, colour=D_ON_ACCENT,
                  spacing=-2, left=panel + 40, top=top + 40, width=inner)]
    cursor = block[0]['top'] + block[0]['height'] + 22
    for paragraph in ['Read the Thursday newsletter. Every deadline that matters is in it.',
                      'Volunteer for one event. The library and the spring track meet '
                      'need the most hands.']:
        item = text(paragraph, font_=GROTESK, size=28, colour=D_ON_ACCENT,
                    line_height=1.5, left=panel + 40, top=cursor, width=inner)
        block.append(item)
        cursor = item['top'] + item['height'] + 18
    tail = text(f'{CONTACT_MAIL}<br/>{CONTACT_PHONE}', font_=JETBRAINS, size=24,
                colour=D_ON_ACCENT_DIM, line_height=1.5, left=panel + 40, top=cursor,
                width=inner)
    block.append(tail)
    layers.append(rect(D_ACCENT, left=panel, top=top, width=panel_w,
                       height=tail['top'] + tail['height'] + 40 - top))
    layers += block
    return 'Dark slide — the year ahead', D_BG, layers


# ----------------------------------------------------------------- 5 pastel --
# Cream paper and rounded white cards, Karla for the reading and DM Serif
# Display for every number and heading.

P_BG = '#FBF7F1ff'
P_INK = '#322E29ff'
P_DEEP = '#3C4A37ff'
P_GREEN = '#667A5Fff'
P_RUST = '#B4735Aff'
P_MUTED = '#8A8175ff'
P_BODY = '#6B6459ff'
P_SOFT = '#57514Aff'
P_CARD = '#FFFFFFff'
P_SAND = '#EFE6DDff'
P_MINT = '#E8EBE3ff'
P_RULE = '#E4DBD0ff'
P_RULE2 = '#EFE8DEff'
P_WELL = '#F2EDE4ff'
P_HATCH = '#322E290F'
P_PANEL_TEXT = '#F4F6F1ff'
P_PANEL_DIM = '#BCC7B6ff'

P_LEFT, P_RIGHT = 100, 1820
P_BODY_W = P_RIGHT - P_LEFT
CARD_R = 24


def p_eyebrow(label):
    return [
        circle(P_RUST, left=P_LEFT, top=100, size=14),
        text(label.upper(), font_=KARLA, size=26, colour=P_MUTED, spacing=10,
             left=P_LEFT + 34, top=90, width=1200, height=34),
    ]


def pastel_cover():
    layers = [
        text(SCHOOL.upper(), font_=KARLA, size=26, colour=P_MUTED, spacing=10,
             left=P_LEFT, top=90, width=1000, height=34),
        text('2025 / 26', font_=KARLA, size=26, colour=P_RUST, spacing=10,
             align='right', left=P_RIGHT - 500, top=90, width=500, height=34),
    ]
    (col, col_w), (side, side_w) = columns(P_BODY_W, [1.35, 1], 66, left=P_LEFT)
    heading = text(TITLE, font_=DM_SERIF, size=108, colour=P_DEEP, line_height=1.0,
                   left=col, top=224, width=col_w)
    lede = text('A review of the 2025–26 school year, the results behind it, and '
                'the calendar for the year ahead.', font_=KARLA, size=36, colour=P_BODY,
                line_height=1.45, left=col, top=heading['top'] + heading['height'] + 32,
                width=col_w)
    pills = lede['top'] + lede['height'] + 40
    layers += centre_block(
        [heading, lede,
         rect(P_CARD, left=col, top=pills, width=380, height=66, radius=33),
         text(f'{PRINCIPAL}, Principal', font_=KARLA, size=26, colour=P_GREEN,
              align='center', left=col, top=pills + 17, width=380, height=36),
         rect(P_CARD, left=col + 398, top=pills, width=300, height=66, radius=33),
         text('Sept 15, 7:00 p.m.', font_=KARLA, size=26, colour=P_GREEN,
              align='center', left=col + 398, top=pills + 17, width=300, height=36)],
        top=170, bottom=789)
    layers += [hatch(left=side, top=244, width=side_w, height=470, stripe=P_HATCH,
                     fill=P_WELL, radius=26),
               text('image: students in the courtyard', font_=KARLA, size=22,
                    colour=P_MUTED, spacing=4, left=side + 24, top=714 - 52,
                    width=side_w - 48, height=30)]

    for (label, value), (x, width) in zip(COVER_FACTS, columns(P_BODY_W, [1, 1, 1, 1], 24, left=P_LEFT)):
        layers += [
            rect(P_CARD, left=x, top=835, width=width, height=165, radius=22),
            text(label.upper(), font_=KARLA, size=24, colour=P_MUTED, spacing=10,
                 left=x + 32, top=865, width=width - 64, height=30),
            text(value, font_=DM_SERIF, size=54, colour=P_GREEN, left=x + 32, top=903,
                 width=width - 64, height=70),
        ]
    return 'Pastel slide — cover', P_BG, layers


def pastel_numbers():
    layers = p_eyebrow(SECTIONS[0])
    heading = text('Enrollment grew for a third year while class sizes held steady',
                   font_=DM_SERIF, size=68, colour=P_DEEP, line_height=1.1,
                   left=P_LEFT, top=164, width=1400)
    layers.append(heading)

    top = heading['top'] + heading['height'] + 40
    cards = columns(P_BODY_W, [1, 1, 1, 1], 24, left=P_LEFT)
    notes = [text(caption, font_=KARLA, size=27, colour=P_BODY, line_height=1.5,
                  left=x + 32, top=top + 124, width=width - 64)
             for (_number, caption), (x, width) in zip(STATS_ALT, cards)]
    card_h = max(note['height'] for note in notes) + 156
    for index, ((number, _caption), (x, width), note) in enumerate(zip(STATS_ALT, cards, notes)):
        highlight = index == 3
        layers += [
            rect(P_SAND if highlight else P_CARD, left=x, top=top, width=width,
                 height=card_h, radius=CARD_R),
            text(number, font_=DM_SERIF, size=80, colour=P_RUST if highlight else P_GREEN,
                 line_height=1.0, left=x + 32, top=top + 32, width=width - 64),
            note,
        ]

    band = top + card_h + 24
    left_w = cards[1][0] + cards[1][1] - P_LEFT
    for paragraph, (x, width) in zip([GROWTH, STAFFING], columns(left_w, [1, 1], 44, left=P_LEFT)):
        layers.append(text(paragraph, font_=KARLA, size=27, colour=P_SOFT,
                           line_height=1.6, left=x, top=band + 8, width=width))
    side, side_w = cards[2][0], P_RIGHT - cards[2][0]
    for index, (grade, detail) in enumerate(GRADE_SIZES):
        y = band + 8 + index * 62
        layers += [
            text(grade, font_=KARLA, size=28, colour=P_MUTED, left=side, top=y,
                 width=300, height=38),
            text(detail, font_=KARLA, size=28, colour=P_INK, align='right',
                 left=side + side_w - 500, top=y, width=500, height=38),
        ]
        if index < 2:
            layers.append(hairline(P_RULE, left=side, top=y + 48, width=side_w, thickness=1))
    return 'Pastel slide — the year in numbers', P_BG, layers


def pastel_results():
    layers = p_eyebrow(SECTIONS[1])
    heading = text(RESULTS_HEAD, font_=DM_SERIF, size=68, colour=P_DEEP,
                   line_height=1.1, left=P_LEFT, top=164, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 38
    (table, table_w), (aside, aside_w) = columns(P_BODY_W, [1.65, 1], 60, left=P_LEFT)

    inner, pad = table + 40, 36
    edges = [(inner, 240, 'left'), (inner + 310, 190, 'right'), (inner + 480, 160, 'right'),
             (inner + 630, 180, 'right'), (inner + 800, table_w - 80 - 800, 'right')]
    heads = ['Grade', 'Reading', 'Math', 'Change', 'District']
    for label, (hx, hw), (_x, _width, align) in zip(heads, head_boxes(edges), edges):
        layers.append(text(label.upper(), font_=KARLA, size=24, weight=700, colour=P_MUTED,
                           spacing=8, align=align, left=hx, top=top + pad, width=hw,
                           height=32))
    row = top + pad + 48
    layers.append(hairline(P_RULE, left=inner, top=row, width=table_w - 80, thickness=2))
    row += 2
    for index, score in enumerate(SCORES):
        last = index == len(SCORES) - 1
        for column_index, (value, (x, width, align)) in enumerate(zip(score, edges)):
            colour = P_INK
            if last:
                colour = P_DEEP
            if column_index == 3:
                colour = P_RUST
            elif column_index == 4:
                colour = P_MUTED
            layers.append(text(value if column_index != 3 else f'{value} pts',
                               font_=KARLA, size=29, colour=colour,
                               weight=700 if last else 400, align=align, left=x,
                               top=row + 22, width=width, height=40))
        row += 82
        if not last:
            layers.append(hairline(P_RULE2, left=inner, top=row - 1, width=table_w - 80,
                                   thickness=1))
    note = text(NOTE, font_=KARLA, size=24, colour=P_MUTED, line_height=1.5,
                left=inner, top=row + 22, width=table_w - 80)
    layers.insert(len(p_eyebrow(SECTIONS[1])) + 1,
                  rect(P_CARD, left=table, top=top, width=table_w,
                       height=note['top'] + note['height'] + pad - top, radius=26))
    layers.append(note)

    cursor = top
    for index, (label, detail) in enumerate(FOCUS):
        head = text(label.upper(), font_=KARLA, size=25,
                    colour=P_GREEN if index == 0 else P_RUST, spacing=8,
                    left=aside + 30, top=cursor + 30, width=aside_w - 60, height=32)
        body = text(detail, font_=KARLA, size=27, colour=P_SOFT if index == 0 else P_BODY,
                    line_height=1.5, left=aside + 30, top=head['top'] + 44,
                    width=aside_w - 60)
        card_h = body['top'] + body['height'] + 30 - cursor
        layers += [rect(P_MINT if index == 0 else P_CARD, left=aside, top=cursor,
                        width=aside_w, height=card_h, radius=CARD_R), head, body]
        cursor += card_h + 20
    return 'Pastel slide — results', P_BG, layers


def pastel_facilities():
    layers = p_eyebrow(SECTIONS[2])
    top = 162
    (col, col_w), (side, side_w) = columns(P_BODY_W, [1.15, 1], 60, left=P_LEFT)
    layers += [
        hatch(left=col, top=top, width=col_w, height=500, stripe=P_HATCH, fill=P_WELL,
              radius=26),
        text(PROJECTS[0][3], font_=KARLA, size=22, colour=P_MUTED, spacing=4,
             left=col + 24, top=top + 500 - 52, width=col_w - 48, height=30),
        text(ENTRY_CAPTION, font_=KARLA, size=26, colour=P_BODY, line_height=1.55,
             left=col, top=top + 522, width=col_w),
    ]
    heading = text(PROJECTS_HEAD, font_=DM_SERIF, size=62, colour=P_DEEP,
                   line_height=1.1, left=side, top=top, width=side_w)
    layers.append(heading)
    cursor = heading['top'] + heading['height'] + 30
    for index, (_number, _name, detail, _image) in enumerate(PROJECTS):
        body = text(detail, font_=KARLA, size=27, colour=P_SOFT, line_height=1.5,
                    left=side + 104, top=cursor + 24, width=side_w - 128)
        card_h = max(56, body['height']) + 48
        layers += [
            rect(P_CARD, left=side, top=cursor, width=side_w, height=card_h, radius=22),
            circle(P_MINT, left=side + 24, top=cursor + 24, size=56),
            text(str(index + 1), font_=DM_SERIF, size=28, colour=P_GREEN, align='center',
                 left=side + 24, top=cursor + 37, width=56, height=36),
            body,
        ]
        cursor += card_h + 16
    return 'Pastel slide — facilities', P_BG, layers


def pastel_year_ahead():
    layers = p_eyebrow(SECTIONS[3])
    heading = text(DATES_HEAD, font_=DM_SERIF, size=68, colour=P_DEEP, line_height=1.1,
                   left=P_LEFT, top=164, width=1500)
    layers.append(heading)
    top = heading['top'] + heading['height'] + 38
    (grid, grid_w), (panel, panel_w) = columns(P_BODY_W, [1.55, 1], 60, left=P_LEFT)

    cell_w, card_h = (grid_w - 18) // 2, 175
    for index, (_short, long, label) in enumerate(DATES):
        x = grid + (index % 2) * (cell_w + 18)
        y = top + (index // 2) * (card_h + 18)
        layers += [
            rect(P_CARD, left=x, top=y, width=cell_w, height=card_h, radius=22),
            text(long.upper(), font_=KARLA, size=25, colour=P_RUST, spacing=8,
                 left=x + 28, top=y + 26, width=cell_w - 56, height=32),
            text(label, font_=KARLA, size=28, colour=P_INK, line_height=1.45,
                 left=x + 28, top=y + 68, width=cell_w - 56, height=84),
        ]

    inner = panel_w - 80
    block = [text(HELP_HEAD, font_=DM_SERIF, size=38, colour=P_PANEL_TEXT,
                  left=panel + 40, top=top + 40, width=inner)]
    cursor = block[0]['top'] + block[0]['height'] + 22
    for paragraph in HELP:
        item = text(paragraph, font_=KARLA, size=28, colour=P_PANEL_TEXT,
                    line_height=1.55, left=panel + 40, top=cursor, width=inner)
        block.append(item)
        cursor = item['top'] + item['height'] + 18
    tail = text(f'{CONTACT_MAIL} · {CONTACT_PHONE}', font_=KARLA, size=26,
                colour=P_PANEL_DIM, line_height=1.55, left=panel + 40, top=cursor,
                width=inner)
    block.append(tail)
    layers.append(rect(P_DEEP, left=panel, top=top, width=panel_w,
                       height=tail['top'] + tail['height'] + 40 - top, radius=26))
    layers += block
    return 'Pastel slide — the year ahead', P_BG, layers


# Order is what the gallery shows, and the id is FIRST_ID plus the position, so
# a new slide goes on the end of its theme only if you are willing to renumber
# everything after it — the covers already shot are keyed to the id.
BUILDERS = [
    editorial_cover, editorial_numbers, editorial_results, editorial_facilities,
    editorial_year_ahead,
    swiss_cover, swiss_numbers, swiss_results, swiss_facilities, swiss_year_ahead,
    academic_cover, academic_numbers, academic_results, academic_facilities,
    academic_year_ahead,
    dark_cover, dark_numbers, dark_results, dark_facilities, dark_year_ahead,
    pastel_cover, pastel_numbers, pastel_results, pastel_facilities,
    pastel_year_ahead,
]

# The category the Templates panel files this pack under. These sit under the
# same Slides chip as the school pack's slides: a themed slide and a plain one
# are the same thing to someone looking for a slide. The slugs are named in
# templates/cates.json.
CATE = 'slide'


# -------------------------------------------------------------------- write --

def page(title, background):
    return {
        'name': title, 'type': 'page', 'uuid': '-1', 'left': 0, 'top': 0,
        'width': W, 'height': H, 'backgroundColor': background,
        'backgroundImage': '', 'opacity': 1, 'tag': 0, 'setting': [], 'record': {},
    }


LIST = os.path.join(TEMPLATES, 'list.json')
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
        title, background, layers = build()
        data = [{'global': page(title, background), 'layers': layers}]
        record = {
            'id': str(template_id), 'title': title, 'width': W, 'height': H,
            'pack': PACK, 'data': json.dumps(data, ensure_ascii=False),
        }
        with open(os.path.join(TEMPLATES, f'{template_id}.json'), 'w', encoding='utf-8') as handle:
            json.dump(record, handle, ensure_ascii=False)
        entries.append({
            'id': template_id, 'cover': f'/covers/template-{template_id}.png',
            'title': title, 'width': W, 'height': H, 'state': 1,
            'cate': CATE, 'pack': PACK,
        })
        overflow = max((layer['top'] + layer['height'] for layer in layers), default=0)
        flag = '  <- runs past the page' if overflow > H else ''
        print(f'  {template_id}.json  {title:<38} {len(layers):>3} layers  '
              f'bottom {overflow}{flag}')

    keep = [item for item in read_list() if item.get('pack') != PACK]
    write_list(keep + entries)
    print(f'\n  list.json: {len(entries)} templates in the "{PACK}" pack')
    print('  Next: node make-template-covers.mjs --pack=slide-themes  (with the app running)')


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
