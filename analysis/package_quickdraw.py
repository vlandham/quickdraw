import sys
import json

filename = sys.argv[1]

def combine_cords(stroke):
    return zip(stroke[0], stroke[1])


draws = []
with open(filename) as f:
    for line in f:
        drawing = json.loads(line)
        strokes = []
        for stroke in drawing['drawing']:
            strokes.append(combine_cords(stroke))
        drawing['drawing'] = strokes
        draws.append(drawing)

print(len(draws))

outfile = 'out.json'

with open(outfile, 'w') as out:
    json.dump(draws, out)


