#!/usr/bin/env python3
"""check_notes.py <deck_root> [--minutes 15] [--wpm 125] [--cpm 260] [--turn 3] [--own] [--max-words 28] [--max-chars 60]

Checks the speaker notes (<aside>) of a Slides deck as a script that will be
read aloud word for word, and prints the timing of every slide.

  E = cannot be spoken as written, or breaks a hard limit. Must be fixed.
  W = likely to sound wrong (written style, childish, reads the slide). Review each.

--minutes  talk length; flags a script that leaves less than one minute of buffer
--wpm      speaking rate for space-separated languages (125 suits non-native speakers)
--cpm      speaking rate in characters per minute for Chinese, Japanese and Korean
--turn     seconds lost on every slide change
--own      the presenter is an author of the paper, so "we propose" is fine
--max-words  longest sentence, in words, before a warning (languages written with spaces)
--max-chars  longest sentence, in characters, before a warning (Chinese, Japanese, Korean)

<deck_root> is the folder that contains project/deck.json. Standard library only.
Exit code 0 = no E findings, 1 = at least one E finding, 2 = could not run.
"""
import argparse
import html
import json
import os
import re
import sys

CJK = r"぀-ヿ㐀-䶿一-鿿가-힯"
MARK = re.compile(r"^\s*\[\s*(?:≤|<=|~)?\s*(\d{1,3}):(\d\d)\s*\]\s*")

# (severity, name, pattern, advice)
RULES = [
    ("E", "label-colon", re.compile(r"(?<!\d)[:：](?!\d)"),
     "a label such as 'Result: ...' or 'A: ...' cannot be spoken. Turn it into a sentence"),
    ("E", "list-marker", re.compile(r"(?m)^\s*(?:[-*•・‣▪]|\d{1,2}[.)]|[①-⑳])\s+"),
     "bullets and numbering are for the eye. Say 'first', 'second', 'then'"),
    ("E", "brackets", re.compile(r"[()（）\[\]［］{}]"),
     "an aside in brackets cannot be spoken. Make it its own sentence or drop it"),
    ("E", "symbol", re.compile(r"[→←↑↓⇒⇔≈≒≤≥≠±×÷=<>~∼|&#*_`^]"),
     "write the words you will say: 'leads to', 'about', 'at most', 'times'"),
    ("E", "slash", re.compile(r"(?<=[A-Za-z%s])/(?=[A-Za-z%s])" % (CJK, CJK)),
     "say 'or', 'and' or 'per'"),
    ("E", "abbreviation", re.compile(r"(?i)\b(?:e\.g\.|i\.e\.|etc\.|cf\.|vs\.|figs?\.|sec\.|eqs?\.|tab\.|w/o\b|w/)"),
     "write it as you say it: 'for example', 'that is', 'versus', 'figure'"),
    ("W", "et-al", re.compile(r"(?i)\bet al\b\.?"),
     "say 'the authors' or 'Kim and colleagues'"),
    ("W", "written-style", re.compile(
        r"(?i)\b(?:respectively|the former|the latter|as follows|aforementioned|thereby|whereby|herein|utiliz\w+|"
        r"leverag\w+|in order to|with respect to|due to the fact that|it is worth noting that|it should be noted that|"
        r"notwithstanding)\b|前者|後者|如下|如上"),
     "written style. A listener cannot look back. Use plain spoken wording and repeat the noun"),
    ("W", "childish", re.compile(
        r"(?i)!|！|\b(?:super|awesome|cool|magic\w*|guess what|yay|kinda|gonna|wanna|thingy|a bunch of|stuff|pretty neat)\b"),
     "simple is good, childish is not. Keep an adult, matter-of-fact tone"),
    ("W", "points-without-saying", re.compile(r"(?i)\bas (?:you can see|shown|is shown|we can see)(?: here| on (?:this|the) slide)?\b|如圖所示|如你所見"),
     "say what the figure shows. A listener who is not looking gets nothing from 'as you can see'"),
]
CLAIMS = re.compile(
    r"(?i)\b(?:we|our)\s+(?:propos\w+|present\w*|introduc\w+|design\w*|train\w*|evaluat\w+|method|model|approach|"
    r"system|experiments?|results?)\b")


def words_and_chars(text):
    cjk = len(re.findall("[%s]" % CJK, text))
    latin = len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’%.\-]*", re.sub("[%s]" % CJK, " ", text)))
    return latin, cjk


# Sentence ends. Chinese, Japanese and Korean put no space after 。！？, and a closing bracket may follow the mark
SENT_END = re.compile(r"(?<=[.!?])[\"'”’)\]]*\s+|(?<=[。．！？])[」』）】”’]*\s*|\n+")


def sentences(text):
    """Split notes into sentences, whatever the script."""
    out, pos = [], 0
    for m in SENT_END.finditer(text):
        # the closing brackets belong to the sentence they close
        end = m.start() + len(m.group(0).rstrip()) if m.group(0).strip() else m.start()
        piece = text[pos:end].strip()
        if piece:
            out.append(piece)
        pos = m.end()
    tail = text[pos:].strip()
    if tail:
        out.append(tail)
    return out


def sentence_length(sent, max_words, max_chars):
    """How long a sentence is to say, as a share of the limit, and how to name its length.
    CJK characters are counted one by one; words written with spaces are counted as words."""
    w, c = words_and_chars(sent)
    load = w / max_words + c / max_chars
    if c and c >= 2 * w:
        return load, "%d characters" % (c + sum(len(x) for x in re.findall(r"[A-Za-z0-9]+", re.sub("[%s]" % CJK, " ", sent))))
    if c:
        return load, "%d words and %d characters" % (w, c)
    return load, "%d words" % w


def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def clock(sec):
    sec = int(round(sec))
    return "%d:%02d" % (sec // 60, sec % 60)


def snippet(text, m):
    a, b = max(0, m.start() - 28), min(len(text), m.end() + 28)
    return text[a:b].replace("\n", " ").strip()


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("root")
    ap.add_argument("--minutes", type=float, default=None)
    ap.add_argument("--wpm", type=float, default=125)
    ap.add_argument("--cpm", type=float, default=260)
    ap.add_argument("--turn", type=float, default=3)
    ap.add_argument("--own", action="store_true")
    ap.add_argument("--max-words", type=float, default=28)
    ap.add_argument("--max-chars", type=float, default=60)
    a = ap.parse_args()

    try:
        deck = json.load(open(os.path.join(a.root, "project", "deck.json"), encoding="utf-8"))
    except OSError as e:
        print("cannot read project/deck.json: %s" % e)
        return 2

    elapsed, errors, warnings = 0.0, 0, 0
    total_words, total_cjk = 0, 0
    print("#\tid\twords\ttalk\tstart-by")
    for n, sid in enumerate(deck.get("order", []), 1):
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", sid):
            continue
        path = os.path.join(a.root, "project", "slides", sid + ".html")
        if not os.path.exists(path):
            continue
        src = open(path, encoding="utf-8").read()
        m = re.search(r"<aside[^>]*>(.*?)</aside>", src, re.S)
        raw = html.unescape(re.sub(r"<[^>]+>", " ", m.group(1))).strip() if m else ""
        mark = MARK.match(raw)
        notes = MARK.sub("", raw)
        is_cover = bool(re.search(r"<section[^>]*class=\"[^\"]*\bcover\b", src))
        found = []

        if not notes:
            found.append(("W" if is_cover else "E", "empty", "no speaker notes on this slide", ""))
        if len(raw) > 4000:
            found.append(("E", "too-long", "notes are %d characters; Slides keeps at most 4000" % len(raw), ""))
        for sev, name, rx, advice in RULES:
            for hit in list(rx.finditer(notes))[:3]:
                found.append((sev, name, advice, snippet(notes, hit)))
        if not a.own:
            for hit in list(CLAIMS.finditer(notes))[:2]:
                found.append(("W", "we-for-authors", "this is someone else's paper: say 'the authors'", snippet(notes, hit)))

        # Sentences that are hard to say or to follow by ear
        for sent in sentences(notes):
            load, size = sentence_length(sent, a.max_words, a.max_chars)
            if load > 1:
                found.append(("W", "long-sentence", "%s: split it, one idea per sentence" % size, sent[:60]))
            if len(re.findall(r"\d+(?:\.\d+)?", sent)) >= 4:
                found.append(("W", "number-pile", "four or more numbers in one sentence are lost on a listener", sent[:60]))

        # Reading the slide aloud: slide lines repeated word for word in the notes
        body = re.sub(r"<aside[^>]*>.*?</aside>", "", src, flags=re.S)
        lines = [strip_tags(x) for _, attrs, x in re.findall(r"<(li|p|td)\b([^>]*)>(.*?)</\1>", body, re.S)
                 if "cite" not in attrs]
        flat = re.sub(r"\s+", " ", notes).lower()
        copied = [ln for ln in lines
                  if (words_and_chars(ln)[0] >= 5 or words_and_chars(ln)[1] >= 12) and ln.lower() in flat]
        if len(copied) >= 2:
            found.append(("W", "reads-the-slide", "%d slide lines are repeated word for word. Say them in your own words" % len(copied), copied[0][:60]))

        w, c = words_and_chars(notes)
        total_words += w
        total_cjk += c
        talk = w / a.wpm * 60 + c / a.cpm * 60
        if mark:
            claimed = int(mark.group(1)) * 60 + int(mark.group(2))
            if abs(claimed - elapsed) > 15:
                found.append(("W", "time-mark", "marker says %s, the script so far takes %s. Update the marker" % (clock(claimed), clock(elapsed)), ""))
        elif notes and not is_cover:
            found.append(("W", "time-mark", "start the notes with [≤ %s]" % clock(elapsed), ""))

        print("%d\t%s\t%d\t%s\t%s" % (n, sid, w + c, clock(talk), clock(elapsed)))
        for sev, name, advice, ctx in found:
            errors += sev == "E"
            warnings += sev == "W"
            print("\t%s %s: %s%s" % (sev, name, advice, ('  «%s»' % ctx) if ctx else ""))
        elapsed += talk + a.turn

    total = elapsed
    print("\nTotal %s at %g wpm / %g cpm, %gs per slide change." % (clock(total), a.wpm, a.cpm, a.turn))
    if a.minutes is not None:
        limit = a.minutes * 60
        if total > limit - 60:
            errors += 1
            over = total - (limit - 60)
            cut = ("%d characters" % (int(over / 60 * a.cpm) + 1)) if total_cjk > total_words else ("%d words" % (int(over / 60 * a.wpm) + 1))
            print("E over-time: %s leaves less than a minute of buffer in a %g-minute talk. Cut %s."
                  % (clock(total), a.minutes, cut))
        elif total < limit * 0.75:
            warnings += 1
            print("W short: the script uses under 75%% of a %g-minute talk." % a.minutes)
    print("%d error(s), %d warning(s)." % (errors, warnings))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
