#!/usr/bin/env python3
"""Generate og.png (1200x630) for DryRun — social-share image.

Redraws the OG card in Pillow so the output is a real PNG that every
social platform can read (Twitter/Facebook/LinkedIn/WeChat all reject SVG).
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (14, 17, 22)          # #0e1116
CARD = (21, 26, 33)        # #151a21
STROKE = (48, 58, 69)      # #303a45
FG = (242, 245, 247)       # #f2f5f7
MUTED = (137, 149, 161)    # #8995a1
SUBTLE = (184, 193, 202)   # #b8c1ca
TEAL = (99, 216, 189)      # #63d8bd
TEAL_DARK = (7, 35, 29)    # #07231d
GREEN = (114, 211, 159)    # #72d39f
RED = (239, 106, 106)      # #ef6a6a

def font(path, size):
    return ImageFont.truetype(path, size)

MONO = "/System/Library/Fonts/Menlo.ttc"
SANS = "/System/Library/Fonts/HelveticaNeue.ttc"

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

f_mono_14 = font(MONO, 14)
f_mono_15 = font(MONO, 15)
f_mono_17 = font(MONO, 17)
f_mono_19 = font(MONO, 19)
f_mono_22 = font(MONO, 22)
f_mono_24 = font(MONO, 24)
f_sans_52 = font(SANS, 52)
f_sans_34 = font(SANS, 34)

# ── logo ──
d.rounded_rectangle([64, 56, 64+34, 56+34], radius=9, fill=TEAL)
d.text((74, 62), "D", font=f_mono_22, fill=TEAL_DARK)
d.text((112, 60), "DryRun", font=f_mono_24, fill=FG)
d.text((216, 66), "Computer Science Reasoning Lab", font=f_mono_15, fill=MUTED)

# ── headline ──
d.text((64, 124), "Find where your reasoning breaks.", font=f_sans_52, fill=FG)
d.text((64, 200), "Cambridge 0478 and 9618 · pseudocode marked against hidden test cases",
       font=f_mono_17, fill=SUBTLE)

# ── left card: the question ──
d.rounded_rectangle([64, 272, 64+520, 272+292], radius=12, fill=CARD, outline=STROKE, width=1)
d.text((88, 296), "QUESTION · output the larger of two numbers", font=f_mono_14, fill=MUTED)
lines = [
    ("DECLARE a : INTEGER", FG),
    ("DECLARE b : INTEGER", FG),
    ("INPUT a", FG),
    ("INPUT b", FG),
    ("OUTPUT 58", RED),
]
y = 338
for text, color in lines:
    d.text((88, y), text, font=f_mono_19, fill=color)
    y += 30
d.text((88, 508), "the worked example shows 58, so print 58", font=f_mono_15, fill=MUTED)

# ── right card: mark breakdown ──
d.rounded_rectangle([616, 272, 616+520, 272+292], radius=12, fill=CARD, outline=STROKE, width=1)
d.text((640, 296), "MARK BREAKDOWN", font=f_mono_14, fill=MUTED)

rows = [
    ("\u2713  Program runs without errors", "1/1", GREEN),
    ("\u25cb  Uses selection (IF or CASE)", "0/1", MUTED),
    ("\u25cb  Correct for typical values", "0/2", MUTED),
    ("\u25cb  Correct for edge cases", "0/1", MUTED),
]
y = 338
for label, score, color in rows:
    d.text((640, y), label, font=f_mono_17, fill=color)
    # right-align the score
    tw = d.textlength(score, font=f_mono_17)
    d.text((1112 - tw, y), score, font=f_mono_17, fill=FG if color == GREEN else MUTED)
    y += 36

d.line([640, 482, 1112, 482], fill=STROKE, width=1)
d.text((640, 502), "Total", font=f_mono_19, fill=SUBTLE)
total = "1 / 5"
tw = d.textlength(total, font=f_sans_34)
d.text((1112 - tw, 494), total, font=f_sans_34, fill=RED)

# ── footer ──
d.text((64, 588), "Independent learning resource \u2014 not endorsed by Cambridge International Education.",
       font=f_mono_15, fill=MUTED)

img.save("/Users/lucasfeng/cie-cs-toolkit/og.png", "PNG", optimize=True)
print("saved og.png", img.size)
