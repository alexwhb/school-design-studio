#!/usr/bin/env python3
"""Checks that every bundled template has said what the brand may change.

A template arrives from the gallery in the school's colours because it carries
a `brand` block naming which of its colours is primary, secondary and so on,
and because each text box carries a `brandRole` saying whether it wants the
kit's heading font or its body font. This walks all of them and complains
about anything that has been left undecided:

  - a colour that is painted somewhere, is not a neutral by the app's own
    test, and has neither a role nor a written-down reason to be left alone
  - a role, or a colour key, the contract does not define
  - a role given to a colour the template never paints
  - a text box whose brandRole is not one of heading, body or keep

The reasons live with the designs, in the LEAVE table of whichever generator
draws the pack, so this script reads them from there rather than keeping a
second copy that could drift.

    python3 check-brand-roles.py

Prints a row per template and exits non-zero if anything is undecided.
"""
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TEMPLATES = os.path.join(ROOT, 'service', 'src', 'mock', 'templates')

# The roles the contract defines, and where each one reads from the kit.
ROLES = ['primary', 'secondary', 'accent'] + [f'colour{n}' for n in range(4, 9)]
TEXT_ROLES = {'heading', 'body', 'keep'}
HEX_KEY = re.compile(r'^[0-9a-f]{6}$')
HEX_VALUE = re.compile(r'^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$')


def load(path):
    """Imports a generator by path, for its LEAVE table."""
    name = os.path.basename(path).replace('-', '_')[:-3]
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def key(colour):
    return colour.lstrip('#')[:6].lower()


def is_neutral(rgb):
    """isNeutralColor from src/store/widget/brand.ts, kept in step by hand."""
    r, g, b = (int(rgb[i:i + 2], 16) for i in (0, 2, 4))
    high, low = max(r, g, b), min(r, g, b)
    lightness = (high + low) / 2 / 255
    return high - low < 28 or lightness > 0.94 or lightness < 0.1


def heading_threshold(page):
    """headingThreshold from the same file: what counts as a heading by size."""
    return round(min(page['width'], page['height']) * 0.045)


def painted(data):
    """Every flat colour the design paints, and how many places paint it."""
    found = {}
    for layout in data:
        for colour in [layout['global'].get('backgroundColor')]:
            match = HEX_VALUE.match(colour or '')
            if match:
                found[match.group(1).lower()] = found.get(match.group(1).lower(), 0) + 1
        for layer in layout['layers']:
            values = [layer['color']] if layer['type'] == 'w-text' else []
            values += layer.get('colors', []) or []
            for colour in values:
                match = HEX_VALUE.match(colour or '')
                if match:
                    found[match.group(1).lower()] = found.get(match.group(1).lower(), 0) + 1
    return found


def check(record, leave, problems):
    data = json.loads(record['data'])
    brand = record.get('brand') or {}
    roles = brand.get('colors') or {}
    keeps_palette = bool(brand.get('keep'))
    here = painted(data)
    say = lambda text: problems.append(f"{record['id']}: {text}")

    for colour, role in roles.items():
        if not HEX_KEY.match(colour):
            say(f'{colour!r} is not a lowercase six-digit hex without a hash')
        if role not in ROLES:
            say(f'{colour} asks for {role!r}, which is not a role')
        if colour not in here:
            say(f'{colour} has a role but is never painted')

    unroled = []
    for colour in sorted(here):
        if is_neutral(colour) or colour in roles or keeps_palette:
            continue
        if colour in leave:
            unroled.append(colour)
        else:
            say(f'{colour} is painted {here[colour]}x, is not a neutral, and has no role')

    counts = {'heading': 0, 'body': 0, 'keep': 0, 'by size': 0}
    for layout in data:
        threshold = heading_threshold(layout['global'])
        for layer in layout['layers']:
            if layer['type'] != 'w-text':
                continue
            role = layer.get('brandRole')
            if role is None:
                # No role of its own: the app falls back to the size rule.
                weight = layer.get('fontWeight')
                heading = weight in ('bold', 'bolder') or float(weight or 400) >= 600 \
                    or float(layer.get('fontSize') or 0) >= threshold
                counts['by size'] += 1
                counts['heading' if heading else 'body'] += 1
            elif role in TEXT_ROLES:
                counts[role] += 1
            else:
                say(f'a text box asks for {role!r}, which is not heading, body or keep')
    return roles, unroled, counts, keeps_palette


def main():
    leave = {}
    for name in ('make-school-templates.py', 'make-slide-themes.py'):
        module = load(os.path.join(ROOT, 'tools', name))
        leave.update({key(colour): reason for colour, reason in module.LEAVE.items()})

    problems = []
    names = sorted(f for f in os.listdir(TEMPLATES) if re.match(r'^\d+\.json$', f))
    print(f'{"id":<5}{"title":<40}{"colours":<44}{"left":<6}'
          f'{"head":>5}{"body":>5}{"keep":>5}{"size":>5}')
    print('-' * 115)
    totals = {'heading': 0, 'body': 0, 'keep': 0, 'by size': 0}
    for name in names:
        record = json.load(open(os.path.join(TEMPLATES, name), encoding='utf-8'))
        roles, unroled, counts, keeps = check(record, leave, problems)
        for slot in totals:
            totals[slot] += counts[slot]
        shown = ' '.join(f'{colour}={role[:4]}' for colour, role in roles.items())
        print(f'{record["id"]:<5}{record["title"][:38]:<40}'
              f'{("keep " if keeps else "") + shown:<44}{len(unroled):<6}'
              f'{counts["heading"]:>5}{counts["body"]:>5}{counts["keep"]:>5}'
              f'{counts["by size"]:>5}')
    print('-' * 115)
    print(f'{len(names)} templates{"":<34}{"":<44}{"":<6}'
          f'{totals["heading"]:>5}{totals["body"]:>5}{totals["keep"]:>5}'
          f'{totals["by size"]:>5}')

    if leave:
        print('\nPainted, not neutral, deliberately left alone:')
        for colour, reason in sorted(leave.items()):
            print(f'  {colour}  {reason}')

    if problems:
        print(f'\n{len(problems)} undecided:')
        for problem in problems:
            print(f'  {problem}')
        return 1
    print('\nEvery non-neutral colour has a role or a reason, and every text box a role.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
