#!/usr/bin/env python3
"""Replace Chinese source strings with English across the poster-design fork.

Long phrases (>=4 chars) are replaced as plain substrings, longest first.
Short tokens (<=3 chars) are ambiguous, so they are only replaced when they are
the *entire* contents of a quoted literal, an HTML text node, or a comment.
"""
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MAP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'i18n-map.json')
CJK = re.compile(r'[一-鿿　-〿＀-￯]')

# '背景' here matches a Photoshop layer name inside a .psd file, not UI text.
SKIP_LINES = {
    ('src/utils/plugins/psd/index.ts', "['Background', 'background', '背景']"),
}


def load():
    m = json.load(open(MAP, encoding='utf-8'))
    m.pop('_comment', None)
    long_keys = sorted([k for k in m if len(k) >= 4], key=len, reverse=True)
    short = {k: v for k, v in m.items() if len(k) <= 3}
    return m, long_keys, short


def apply_short(text, short):
    """Replace a short token only when it is the whole literal / node / comment."""
    def whole(m):
        quote, body = m.group(1), m.group(2)
        hit = short.get(body.strip())
        return f'{quote}{hit}{quote}' if hit is not None else m.group(0)

    # quoted string literals: 'x'  "x"  `x`
    text = re.sub(r'(["\'`])([^"\'`<>\n]*)\1', whole, text)

    # html text nodes: >x<
    def node(m):
        hit = short.get(m.group(1).strip())
        return f'>{hit}<' if hit is not None else m.group(0)
    text = re.sub(r'>([^<>{}\n]*)<', node, text)

    # {{ 'x' }} handled above; now whole-line comments and trailing comments
    def comment(m):
        hit = short.get(m.group(2).strip())
        return f'{m.group(1)}{hit}' if hit is not None else m.group(0)
    text = re.sub(r'(//\s*)(.*)$', comment, text, flags=re.M)
    text = re.sub(r'(^\s*\*\s*)(.*)$', comment, text, flags=re.M)
    return text


def main():
    _, long_keys, short = load()
    changed = 0
    for dp, dirs, fns in os.walk(os.path.join(ROOT, 'src')):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for fn in fns:
            if not fn.endswith(('.tsx', '.ts', '.js')):
                continue
            path = os.path.join(dp, fn)
            rel = os.path.relpath(path, ROOT)
            original = open(path, encoding='utf-8').read()
            if not CJK.search(original):
                continue

            protected = []
            text = original
            for skip_rel, snippet in SKIP_LINES:
                if rel.replace(os.sep, '/') == skip_rel and snippet in text:
                    token = f'__PROTECTED_{len(protected)}__'
                    protected.append((token, snippet))
                    text = text.replace(snippet, token)

            for k in long_keys:
                if k in text:
                    text = text.replace(k, _M[k])
            text = apply_short(text, short)

            for token, snippet in protected:
                text = text.replace(token, snippet)

            if text != original:
                open(path, 'w', encoding='utf-8').write(text)
                changed += 1
    print(f'rewrote {changed} files')


_M, _LONG, _SHORT = load()

if __name__ == '__main__':
    main()
