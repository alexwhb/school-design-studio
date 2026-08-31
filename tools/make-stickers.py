#!/usr/bin/env python3
"""Rebuilds Elements > Stickers as a set a Western school would actually use.

The upstream stickers were three hotlinked kawaii planner cut-outs — pastel
raindrops, hearts and a rainbow, captioned in Chinese, served from a Chinese
image host that is often unreachable. This replaces them with flat vector
artwork drawn for school noticeboards, newsletters and slides: the apple, the
bus, the trophy, the clipboard, the lab flask.

Everything is generated here, so there is nothing to licence and nothing
remote to fetch. Each sticker is one self-contained SVG in
`public/stickers/`, and `png.json` points at it.

  python3 make-stickers.py            # write the SVGs and rewrite png.json
  python3 make-stickers.py --list     # just name what it would write

Why SVG for a panel whose JSON file is called png.json: the file name is only
the category key the panel asks for (`cate: 'png'`). Artwork that stays sharp
when someone scales it to fill half a poster is worth more than matching the
name. They are registered as `type: "image"`, not `type: "svg"`, on purpose —
`svg` means "recolourable line art" to this app, and GraphListWrap inverts
those in dark mode, which would wreck full-colour artwork.
"""
import argparse
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
STICKER_DIR = os.path.join(ROOT, 'public', 'stickers')
PNG_JSON = os.path.join(ROOT, 'service', 'src', 'mock', 'materials', 'png.json')

# The same restrained school palette the sample elements use, widened just
# enough to draw with: collegiate navy, a warm red, brass, cream, plus the
# secondaries a bus, a globe and a flask need.
INK = '#2B3440'
RED = '#D0503C'
RED_DK = '#B23A2B'
GOLD = '#E9B949'
GOLD_DK = '#C9992E'
AMBER = '#E07A3F'
CREAM = '#FBF3E4'
WHITE = '#FFFFFF'
NAVY = '#23486B'
BLUE = '#4A90D9'
SKY = '#A9CFEF'
TEAL = '#2FA095'
TEAL_DK = '#22796F'
GREEN = '#57A773'
GREEN_DK = '#3E8055'
PLUM = '#7B5EA7'
PINK = '#E4899B'
GREY = '#CBD3DD'
GREY_DK = '#9AA5B4'
BROWN = '#A9714B'
WOOD = '#E8C08D'

SIZE = 200          # viewBox; every sticker is square
PLACED = 320        # how big it lands on the canvas


# --- tiny SVG helpers -------------------------------------------------------

def _attrs(d):
    out = []
    for k, v in d.items():
        out.append('%s="%s"' % (k.replace('__', ':').replace('_', '-'), v))
    return ' '.join(out)


def el(tag, **kw):
    return '<%s %s/>' % (tag, _attrs(kw))


def path(d, **kw):
    return el('path', d=d, **kw)


def rect(x, y, w, h, **kw):
    return el('rect', x=x, y=y, width=w, height=h, **kw)


def circle(cx, cy, r, **kw):
    return el('circle', cx=cx, cy=cy, r=r, **kw)


def ellipse(cx, cy, rx, ry, **kw):
    return el('ellipse', cx=cx, cy=cy, rx=rx, ry=ry, **kw)


def line(x1, y1, x2, y2, **kw):
    return el('line', x1=x1, y1=y1, x2=x2, y2=y2, **kw)


def polygon(points, **kw):
    pts = ' '.join('%g,%g' % (round(x, 2), round(y, 2)) for x, y in points)
    return el('polygon', points=pts, **kw)


def group(children, **kw):
    return '<g %s>%s</g>' % (_attrs(kw), ''.join(children))


def star(cx, cy, r_out, r_in, points=5, rotate=-90):
    """Points of a regular star, first spike pointing whichever way `rotate` says."""
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rotate + i * 180.0 / points)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def regular_polygon(cx, cy, r, n, rotate=-90):
    return [
        (cx + r * math.cos(math.radians(rotate + i * 360.0 / n)),
         cy + r * math.sin(math.radians(rotate + i * 360.0 / n)))
        for i in range(n)
    ]


def qbez(p0, c, p1, t):
    """A point on a quadratic Bezier — used to hang bunting off its own string."""
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
            u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1])


# --- the stickers -----------------------------------------------------------
# Each returns a list of elements drawn inside a group that already carries the
# shared ink outline, so a shape only names the fill it wants.

def apple():
    return [
        path('M100 54 C118 37 153 39 163 67 C173 96 156 151 130 165 '
             'C118 172 108 165 100 165 C92 165 82 172 70 165 '
             'C44 151 27 96 37 67 C47 39 82 37 100 54 Z', fill=RED),
        path('M100 54 C100 40 104 27 114 20', fill='none', stroke=BROWN, stroke_width=9),
        path('M103 44 C113 25 138 21 148 27 C144 46 123 55 103 44 Z', fill=GREEN),
        ellipse(70, 82, 9, 15, fill=WHITE, opacity='0.45', stroke='none',
                transform='rotate(-22 70 82)'),
    ]


def pencil():
    body = [
        rect(80, 30, 40, 18, fill=GREY, rx=2),
        rect(80, 14, 40, 18, fill=PINK, rx=7),
        rect(80, 46, 40, 108, fill=GOLD),
        rect(102, 46, 18, 108, fill=GOLD_DK, stroke='none'),
        polygon([(80, 154), (120, 154), (100, 188)], fill=WOOD),
        polygon([(92, 171), (108, 171), (100, 188)], fill=INK),
        line(80, 154, 120, 154),
    ]
    return [group(body, transform='rotate(-33 100 100)')]


def books():
    out = []
    for i, (y, fill) in enumerate([(130, BLUE), (100, RED), (70, GOLD)]):
        x, w = 28 + i * 8, 144 - i * 16
        out.append(rect(x, y, w, 30, rx=6, fill=fill))
        out.append(rect(x + 12, y + 6, 8, 18, fill=CREAM, stroke='none'))
    return out


def graduation_cap():
    return [
        path('M64 92 V128 C64 146 136 146 136 128 V92 Z', fill=NAVY),
        polygon([(100, 42), (186, 80), (100, 118), (14, 80)], fill='#2E5B87'),
        circle(100, 80, 7, fill=GOLD),
        path('M170 88 V126', stroke=GOLD, stroke_width=7, fill='none'),
        ellipse(170, 141, 10, 15, fill=GOLD),
    ]


def school_bus():
    out = [
        rect(20, 66, 160, 74, rx=14, fill=GOLD),
        rect(20, 114, 160, 9, fill=INK, stroke='none'),
    ]
    for x in (33, 71, 109):
        out.append(rect(x, 78, 30, 28, rx=5, fill=SKY))
    out += [
        rect(147, 78, 26, 56, rx=5, fill=SKY),
        rect(24, 92, 10, 14, rx=3, fill=RED),
    ]
    for cx in (58, 146):
        out.append(circle(cx, 146, 17, fill=INK))
        out.append(circle(cx, 146, 6, fill=GREY, stroke='none'))
    return out


def backpack():
    return [
        path('M72 70 C72 42 128 42 128 70', fill='none'),
        rect(42, 66, 116, 112, rx=28, fill=TEAL),
        path('M42 106 C42 66 158 66 158 106 Z', fill=TEAL_DK),
        rect(90, 96, 20, 22, rx=5, fill=GOLD),
        rect(68, 128, 64, 40, rx=12, fill=TEAL_DK),
    ]


def clipboard():
    out = [
        rect(44, 40, 112, 138, rx=12, fill=BROWN),
        rect(56, 56, 88, 106, rx=6, fill=WHITE),
        rect(84, 28, 32, 24, rx=7, fill=GREY),
    ]
    for y in (84, 110, 136):
        out.append(path('M68 %d l7 8 l13 -16' % y, fill='none', stroke=GREEN, stroke_width=7))
        out.append(line(96, y, 132, y, stroke=GREY, stroke_width=7))
    return out


def calendar():
    out = [
        rect(60, 26, 12, 32, rx=6, fill=GREY),
        rect(128, 26, 12, 32, rx=6, fill=GREY),
        rect(28, 46, 144, 130, rx=13, fill=WHITE),
        path('M28 59 A13 13 0 0 1 41 46 H159 A13 13 0 0 1 172 59 V82 H28 Z', fill=RED),
    ]
    for row, y in enumerate((108, 142)):
        for col, x in enumerate((62, 100, 138)):
            fill = GOLD if (row, col) == (0, 1) else GREY
            out.append(circle(x, y, 9, fill=fill, stroke='none'))
    return out


def clock():
    return [
        circle(52, 56, 19, fill=RED_DK),
        circle(148, 56, 19, fill=RED_DK),
        path('M62 158 L48 176', stroke=INK, stroke_width=10),
        path('M138 158 L152 176', stroke=INK, stroke_width=10),
        circle(100, 110, 60, fill=RED),
        circle(100, 110, 47, fill=CREAM),
        line(100, 110, 100, 74),
        line(100, 110, 127, 124),
        circle(100, 110, 6, fill=INK),
    ]


def megaphone():
    return [
        path('M166 64 C176 82 176 118 166 136', fill='none', stroke=GOLD, stroke_width=7),
        path('M182 50 C196 76 196 124 182 150', fill='none', stroke=GOLD, stroke_width=7),
        rect(32, 74, 32, 52, rx=13, fill=RED_DK),
        path('M72 126 V144 C72 156 52 156 52 144 V136', fill='none'),
        path('M60 78 L146 40 V160 L60 122 Z', fill=RED),
        ellipse(146, 100, 13, 60, fill=RED),
        ellipse(146, 100, 7, 46, fill=RED_DK, stroke='none'),
    ]


def trophy():
    return [
        path('M64 54 C42 54 40 88 66 94', fill='none'),
        path('M136 54 C158 54 160 88 134 94', fill='none'),
        path('M62 42 H138 V80 C138 108 121 124 100 124 C79 124 62 108 62 80 Z', fill=GOLD),
        polygon(star(100, 78, 22, 9), fill=CREAM),
        rect(90, 124, 20, 22, fill=GOLD_DK),
        rect(62, 146, 76, 14, rx=4, fill=GOLD_DK),
        rect(52, 160, 96, 18, rx=6, fill=GOLD_DK),
    ]


def award_ribbon():
    return [
        polygon([(80, 118), (62, 184), (92, 168)], fill=RED_DK),
        polygon([(120, 118), (138, 184), (108, 168)], fill=RED),
        polygon(star(100, 84, 48, 40, points=14, rotate=-90), fill=RED),
        circle(100, 84, 32, fill=CREAM),
        polygon(star(100, 84, 22, 9), fill=GOLD),
    ]


def gold_star():
    return [
        polygon(star(100, 102, 78, 32), fill=GOLD),
        polygon(star(100, 102, 40, 16), fill=GOLD_DK, stroke='none', opacity='0.45'),
    ]


def palette():
    out = [
        path('M100 40 C150 40 178 74 178 108 C178 133 157 141 141 141 '
             'C127 141 121 149 125 159 C130 172 117 178 100 178 '
             'C56 178 22 146 22 108 C22 68 52 40 100 40 Z', fill=CREAM),
        circle(122, 126, 14, fill=WHITE),
    ]
    for (cx, cy, fill) in ((64, 82, RED), (100, 66, BLUE), (138, 88, GOLD),
                           (54, 122, GREEN), (74, 152, PLUM)):
        out.append(circle(cx, cy, 12, fill=fill))
    return out


def music_notes():
    return [
        polygon([(64, 50), (148, 38), (148, 60), (64, 72)], fill=PLUM),
        rect(64, 50, 9, 96, fill=PLUM),
        rect(139, 38, 9, 98, fill=PLUM),
        ellipse(50, 148, 21, 16, fill=PLUM, transform='rotate(-18 50 148)'),
        ellipse(125, 138, 21, 16, fill=PLUM, transform='rotate(-18 125 138)'),
    ]


def basketball():
    return [
        circle(100, 100, 64, fill=AMBER),
        line(100, 36, 100, 164, stroke_width=5),
        line(36, 100, 164, 100, stroke_width=5),
        path('M56 52 C86 80 86 120 56 148', fill='none', stroke_width=5),
        path('M144 52 C114 80 114 120 144 148', fill='none', stroke_width=5),
    ]


def soccer_ball():
    out = [circle(100, 100, 64, fill=WHITE)]
    pent = regular_polygon(100, 100, 30, 5)
    out.append(polygon(pent, fill=INK))
    for (x, y) in pent:
        dx, dy = x - 100, y - 100
        d = math.hypot(dx, dy)
        out.append(line(round(x, 1), round(y, 1),
                        round(100 + dx / d * 64, 1), round(100 + dy / d * 64, 1),
                        stroke_width=6))
    return out


def flask():
    shape = ('M82 36 H118 V80 L156 148 C163 160 154 174 140 174 H60 '
             'C46 174 37 160 44 148 L82 80 Z')
    return [
        path(shape, fill=WHITE),
        path('M68 118 H132 L156 148 C163 160 154 174 140 174 H60 '
             'C46 174 37 160 44 148 Z', fill=TEAL, stroke='none'),
        path(shape, fill='none'),
        line(85, 56, 115, 56),
        circle(86, 144, 7, fill=WHITE, stroke='none', opacity='0.75'),
        circle(106, 155, 5, fill=WHITE, stroke='none', opacity='0.75'),
        circle(122, 138, 6, fill=WHITE, stroke='none', opacity='0.75'),
    ]


def globe():
    return [
        circle(100, 100, 64, fill=BLUE),
        path('M60 74 C74 62 94 66 98 78 C102 90 88 96 76 94 C64 92 52 84 60 74 Z',
             fill=GREEN, stroke='none'),
        path('M110 114 C126 106 142 116 140 130 C138 143 120 149 108 141 '
             'C97 134 100 119 110 114 Z', fill=GREEN, stroke='none'),
        path('M74 130 C84 126 92 134 88 142 C84 150 70 148 68 140 C67 135 69 132 74 130 Z',
             fill=GREEN, stroke='none'),
        circle(100, 100, 64, fill='none'),
        ellipse(100, 100, 28, 64, fill='none', stroke_width=4),
        line(36, 100, 164, 100, stroke_width=4),
    ]


def ruler():
    body = [rect(28, 82, 144, 38, rx=6, fill=GOLD)]
    x = 42
    i = 0
    while x < 172:
        length = 16 if i % 2 == 0 else 9
        body.append(line(x, 82, x, 82 + length, stroke_width=4))
        x += 13
        i += 1
    body.append(line(28, 108, 172, 108, stroke=GOLD_DK, stroke_width=4))
    return [group(body, transform='rotate(-13 100 100)')]


def crayons():
    out = []
    for dx, angle, fill in ((-38, -14, RED), (0, 0, BLUE), (38, 14, GREEN)):
        body = [
            polygon([(86, 64), (114, 64), (100, 40)], fill=fill),
            rect(86, 64, 28, 84, rx=5, fill=fill),
            rect(86, 80, 28, 54, fill=CREAM),
            line(86, 92, 114, 92, stroke=fill, stroke_width=4),
            line(86, 122, 114, 122, stroke=fill, stroke_width=4),
        ]
        out.append(group(body, transform='rotate(%d 100 160) translate(%d 0)' % (angle, dx)))
    return out


def lightbulb():
    out = []
    for a in (-150, -120, -90, -60, -30):
        r = math.radians(a)
        out.append(line(round(100 + 52 * math.cos(r), 1), round(88 + 52 * math.sin(r), 1),
                        round(100 + 68 * math.cos(r), 1), round(88 + 68 * math.sin(r), 1),
                        stroke=GOLD, stroke_width=7))
    out += [
        circle(100, 88, 42, fill=GOLD),
        path('M86 74 C86 94 100 94 100 108 C100 94 114 94 114 74', fill='none', stroke_width=5),
        line(100, 108, 100, 128, stroke_width=5),
        rect(82, 128, 36, 16, fill=GREY),
        rect(86, 144, 28, 16, rx=5, fill=GREY_DK),
    ]
    return out


def sticky_note():
    return [
        path('M42 42 H158 V128 L126 160 H42 Z', fill='#F6DE7E'),
        path('M158 128 H126 V160 Z', fill='#DCC163'),
        line(64, 74, 136, 74, stroke=GOLD_DK, stroke_width=5),
        line(64, 98, 136, 98, stroke=GOLD_DK, stroke_width=5),
        line(64, 122, 110, 122, stroke=GOLD_DK, stroke_width=5),
    ]


def pushpin():
    return [
        polygon([(94, 118), (106, 118), (100, 172)], fill=GREY_DK),
        rect(84, 96, 32, 24, rx=4, fill=RED_DK),
        circle(100, 70, 32, fill=RED),
        ellipse(89, 60, 7, 10, fill=WHITE, opacity='0.5', stroke='none',
                transform='rotate(-25 89 60)'),
    ]


def bunting():
    p0, ctrl, p1 = (18, 58), (100, 104), (182, 58)
    out = [path('M%d %d Q%d %d %d %d' % (p0 + ctrl + p1), fill='none', stroke_width=5)]
    colours = [RED, GOLD, TEAL, BLUE, PLUM]
    for i, colour in enumerate(colours):
        t = 0.12 + i * 0.19
        x, y = qbez(p0, ctrl, p1, t)
        out.append(polygon([(x - 19, y - 2), (x + 19, y - 2), (x, y + 48)], fill=colour))
    return out


def ticket():
    return [
        path('M34 66 H166 V88 A13 13 0 0 0 166 114 V136 H34 V114 '
             'A13 13 0 0 0 34 88 Z', fill=TEAL),
        line(118, 72, 118, 130, stroke=CREAM, stroke_width=5,
             stroke_dasharray='2 12'),
        polygon(star(76, 101, 22, 9), fill=CREAM),
    ]


def certificate():
    return [
        rect(44, 54, 112, 92, fill=CREAM),
        rect(36, 44, 128, 16, rx=8, fill='#E7DCC5'),
        rect(36, 140, 128, 16, rx=8, fill='#E7DCC5'),
        line(64, 80, 136, 80, stroke=GREY, stroke_width=6),
        line(64, 100, 136, 100, stroke=GREY, stroke_width=6),
        line(64, 120, 108, 120, stroke=GREY, stroke_width=6),
        polygon([(132, 150), (124, 184), (140, 174)], fill=RED_DK),
        polygon([(152, 150), (160, 184), (144, 174)], fill=RED_DK),
        circle(142, 144, 20, fill=RED),
        polygon(star(142, 144, 12, 5), fill=GOLD, stroke='none'),
    ]


def laptop():
    return [
        rect(44, 50, 112, 78, rx=9, fill=NAVY),
        rect(56, 62, 88, 54, rx=4, fill=SKY),
        path('M28 130 H172 L182 152 C185 159 180 164 173 164 H27 '
             'C20 164 15 159 18 152 Z', fill=GREY),
        rect(86, 140, 28, 8, rx=4, fill=GREY_DK, stroke='none'),
    ]


def paper_plane():
    return [
        polygon([(24, 96), (176, 34), (140, 168), (104, 122)], fill=SKY),
        polygon([(24, 96), (176, 34), (104, 122)], fill=WHITE),
        line(104, 122, 176, 34),
        polygon([(104, 122), (104, 164), (78, 138)], fill=BLUE),
    ]


def bell():
    return [
        path('M100 40 C136 40 148 70 150 100 C152 126 160 132 160 142 H40 '
             'C40 132 48 126 50 100 C52 70 64 40 100 40 Z', fill=GOLD),
        circle(100, 36, 10, fill=GOLD_DK),
        path('M86 142 C86 160 114 160 114 142', fill=GOLD_DK),
        path('M76 66 C64 80 62 96 62 112', fill='none', stroke=CREAM, stroke_width=6),
    ]


STICKERS = [
    ('apple', 'Apple', apple),
    ('pencil', 'Pencil', pencil),
    ('books', 'Stack of books', books),
    ('graduation-cap', 'Graduation cap', graduation_cap),
    ('school-bus', 'School bus', school_bus),
    ('backpack', 'Backpack', backpack),
    ('clipboard', 'Clipboard', clipboard),
    ('calendar', 'Calendar', calendar),
    ('clock', 'Alarm clock', clock),
    ('bell', 'Bell', bell),
    ('megaphone', 'Megaphone', megaphone),
    ('bunting', 'Bunting', bunting),
    ('trophy', 'Trophy', trophy),
    ('award-ribbon', 'Award ribbon', award_ribbon),
    ('gold-star', 'Gold star', gold_star),
    ('certificate', 'Certificate', certificate),
    ('ticket', 'Ticket', ticket),
    ('basketball', 'Basketball', basketball),
    ('soccer-ball', 'Soccer ball', soccer_ball),
    ('palette', 'Paint palette', palette),
    ('crayons', 'Crayons', crayons),
    ('music-notes', 'Music notes', music_notes),
    ('flask', 'Lab flask', flask),
    ('globe', 'Globe', globe),
    ('ruler', 'Ruler', ruler),
    ('laptop', 'Laptop', laptop),
    ('lightbulb', 'Light bulb', lightbulb),
    ('sticky-note', 'Sticky note', sticky_note),
    ('pushpin', 'Push pin', pushpin),
    ('paper-plane', 'Paper plane', paper_plane),
]


def render(builder):
    """One sticker, as a standalone SVG document.

    The shared outline lives on the wrapping <g>, so a shape only declares the
    fill it wants. Nothing carries an `id`: two copies of the same sticker can
    sit on one canvas, and duplicate ids would have them fighting over
    references.
    """
    body = ''.join(builder())
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
        'width="%d" height="%d">'
        '<g fill="none" stroke="%s" stroke-width="6" stroke-linejoin="round" '
        'stroke-linecap="round">%s</g></svg>'
    ) % (SIZE, SIZE, SIZE, SIZE, INK, body)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--list', action='store_true', help='name the stickers and stop')
    args = ap.parse_args()

    if args.list:
        for slug, title, _ in STICKERS:
            print('%-16s %s' % (slug, title))
        return

    os.makedirs(STICKER_DIR, exist_ok=True)
    entries = []
    for i, (slug, title, builder) in enumerate(STICKERS, start=1):
        with open(os.path.join(STICKER_DIR, slug + '.svg'), 'w') as fh:
            fh.write(render(builder) + '\n')
        url = '/stickers/%s.svg' % slug
        entries.append({
            'id': i,
            'title': title,
            'width': PLACED,
            'height': PLACED,
            'type': 'image',
            'model': '{}',
            'thumb': url,
            'url': url,
            'state': 1,
        })

    with open(PNG_JSON, 'w') as fh:
        json.dump(entries, fh, indent=2)
        fh.write('\n')

    print('wrote %d stickers to %s' % (len(entries), os.path.relpath(STICKER_DIR, HERE)))


if __name__ == '__main__':
    main()
