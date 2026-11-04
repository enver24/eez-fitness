"""Minimal .xlsx reader using only the standard library (zip + XML)."""
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}


def col_index(ref):
    letters = re.match(r'[A-Z]+', ref).group(0)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_workbook(path):
    z = zipfile.ZipFile(path)
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in root.findall('m:si', NS):
            shared.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])))
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    target = {r.get('Id'): r.get('Target') for r in rels}
    sheets = {}
    for s in wb.find('m:sheets', NS):
        rid = s.get('{%s}id' % NS['r'])
        t = target[rid].lstrip('/')
        sheets[s.get('name')] = t if t.startswith('xl/') else 'xl/' + t
    return z, shared, sheets


def rows(z, shared, sheet_path):
    root = ET.fromstring(z.read(sheet_path))
    for row in root.iter('{%s}row' % NS['m']):
        values = {}
        for c in row.findall('m:c', NS):
            ref = c.get('r')
            t = c.get('t')
            v = c.find('m:v', NS)
            if t == 's' and v is not None:
                val = shared[int(v.text)]
            elif t == 'inlineStr':
                val = ''.join(x.text or '' for x in c.iter('{%s}t' % NS['m']))
            else:
                val = v.text if v is not None else None
            values[col_index(ref)] = val
        if values:
            width = max(values) + 1
            yield [values.get(i) for i in range(width)]


if __name__ == '__main__':
    z, shared, sheets = read_workbook(sys.argv[1])
    print('Sheets:', list(sheets))
    for name, path in sheets.items():
        print('==', name)
        for i, r in enumerate(rows(z, shared, path)):
            print(i, r[:12])
            if i >= 4:
                break
