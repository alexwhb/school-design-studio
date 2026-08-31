#!/usr/bin/env python3
"""Rewrites the bundled sample components so nothing in them is Chinese.

The samples in service/src/mock/components are the "Text with effects" and
"Sample element groups" rows in the Text panel. Upstream they hold Chinese
retail copy set in a Chinese font, so this replaces:

  - the text itself, with short school-flavoured wording
  - the font, with a bundled English family (see FontsData.ts)
  - the layer name and the list titles

Widget `text` is stored URL-encoded, because the app runs it through
decodeURIComponent when a sample is loaded.
"""
import json
import os
import re
import urllib.parse

MOCK = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), '..', 'service', 'src', 'mock'
)
DETAIL = os.path.join(MOCK, 'components', 'detail')
LIST = os.path.join(MOCK, 'components', 'list')

# ZCOOL KuaiLe is a rounded, friendly display face; Fredoka is the closest
# thing in the bundled set, and it ships with the app so it always resolves.
FONT = {
    'alias': 'Fredoka',
    'id': 13,
    'value': 'Fredoka',
    'url': '/fonts/fredoka-400-700.woff2',
}

# id -> (list title, {old decoded text: new text})
SAMPLES = {
    '1': ('Outlined', {'输入文字': 'Field Day'}),
    '2': ('Glow', {'输入文字': 'Well Done!'}),
    '3': ('Shadowed', {'输入文字': 'Book Fair'}),
    '4': ('Heading with a note', {'好物推荐': 'Spring Concert', 'Good thing recommendation': 'Tickets on sale now'}),
    '5': ('Heading with a date', {'今日探店': 'Open Evening', "Today's shop": 'Thursday · 6pm'}),
    '6': ('Bold heading', {'今日上新': 'Sports Day'}),
}


# Widget `name` is the label shown in the Layers panel.
LAYER_NAMES = {'文本': 'Text', '图片': 'Image', '组合': 'Group', '矢量图形': 'Shape', '二维码': 'QR code'}

HAS_CJK = re.compile(r'[\u4e00-\u9fff]')


def convert_widget(widget, mapping):
    """Swaps the text and font on one widget, recursing into grouped children."""
    name = widget.get('name')
    if name in LAYER_NAMES:
        widget['name'] = LAYER_NAMES[name]

    raw = widget.get('text')
    if isinstance(raw, str) and raw:
        decoded = urllib.parse.unquote(raw)
        replacement = mapping.get(decoded)
        if replacement is not None:
            widget['text'] = urllib.parse.quote(replacement)
        elif HAS_CJK.search(decoded):
            # Only complain about text still needing a translation; already
            # converted samples are left alone so this can be re-run safely.
            print(f'    ? unmapped text: {decoded!r}')

    if widget.get('fontClass'):
        widget['fontClass'] = dict(FONT)
    if widget.get('fontFamily'):
        widget['fontFamily'] = FONT['value']

    for child in widget.get('setting') or []:
        convert_widget(child, mapping)


def main():
    for sample_id, (title, mapping) in SAMPLES.items():
        path = os.path.join(DETAIL, f'{sample_id}.json')
        record = json.load(open(path, encoding='utf-8'))
        data = json.loads(record['data'])

        print(f'{sample_id}.json -> {title}')
        widgets = data if isinstance(data, list) else [data]
        for widget in widgets:
            convert_widget(widget, mapping)

        record['data'] = json.dumps(data, ensure_ascii=False)
        record['title'] = title
        json.dump(record, open(path, 'w', encoding='utf-8'), ensure_ascii=False)

    # The two list files drive the panel rows; give them English titles.
    for name in ('text.json', 'comp.json'):
        path = os.path.join(LIST, name)
        items = json.load(open(path, encoding='utf-8'))
        for item in items:
            entry = SAMPLES.get(str(item['id']))
            if entry:
                item['title'] = entry[0]
        json.dump(items, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        print(f'{name}: titles updated')


if __name__ == '__main__':
    main()
