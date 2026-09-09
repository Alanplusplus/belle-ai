#!/usr/bin/env python3
"""Apply complete Hindi translations for sd and ad sections in hi.json."""
import json
import re
import importlib.util
from pathlib import Path

MESSAGES = Path(__file__).resolve().parent.parent / "src" / "messages"
EN = json.load(open(MESSAGES / "en.json", encoding="utf-8"))
HI = json.load(open(MESSAGES / "hi.json", encoding="utf-8"))

spec = importlib.util.spec_from_file_location(
    "build_hi_translations",
    Path(__file__).parent / "build_hi_translations.py",
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
SD = mod.SD
AD = mod.AD

ALLOWED = {
    "AI", "Belle", "BB", "TikTok", "Instagram", "NARS", "MAC", "Fenty",
    "퍼스널컬러", "パーソナルカラー", "春", "夏", "秋", "冬",
}


def find_english(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z]+", text)
    return [w for w in words if w not in ALLOWED and len(w) > 1]


def main():
    for section, data in [("sd", SD), ("ad", AD)]:
        for cat in EN[section]:
            missing = set(EN[section][cat].keys()) - set(data[cat].keys())
            extra = set(data[cat].keys()) - set(EN[section][cat].keys())
            if missing or extra:
                raise SystemExit(f"Key mismatch {section}.{cat}: missing={missing}, extra={extra}")

    HI["sd"] = SD
    HI["ad"] = AD

    cg_fixes = {
        "fr0": "रंग विश्लेषण क्या है? एक पूर्ण परिचय",
        "fr1": "घर पर रंग विश्लेषण कैसे करें",
        "fr2": "मैं कौन सा रंग सीज़न हूँ? अभी जानें",
        "fr3": "ठंडा टोन बनाम गर्म टोन: 5 आसान परीक्षण",
        "fr4": "व्यक्तिगत रंग विश्लेषण के पीछे का विज्ञान",
        "fr5": "AI बनाम पेशेवर रंग विश्लेषण",
        "fr6": "रंग विश्लेषण क्विज़ गलत क्यों होते हैं",
        "fr7": "अपनी त्वचा का अंडरटोन कैसे निर्धारित करें",
        "methodProTitle": "पेशेवर रंग परीक्षण",
        "methodProDesc": "व्यक्तिगत परामर्श जहाँ प्रशिक्षित रंग विशेषज्ञ रंगीन कपड़े आपके चेहरे के पास रखकर देखते हैं कि प्रत्येक रंग आपकी त्वचा को कैसे प्रभावित करता है। सटीकता का स्वर्ण मानक, विशेषकर अस्पष्ट मामलों में।",
        "aiVsPro": "AI बनाम पेशेवर",
        "aiPro0": "मुफ़्त/किफ़ायती",
        "aiPro1": "तुरंत (60 सेकंड)",
        "aiPro2": "24/7",
        "aiPro3": "वस्तुनिष्ठ",
        "quizPro0": "फोटो की ज़रूरत नहीं",
        "quizPro1": "2 मिनट",
        "quizPro2": "अच्छी शुरुआत",
        "quizPro3": "मुफ़्त",
        "proPro0": "सबसे सटीक",
        "proPro1": "विशेषज्ञ",
        "proPro2": "रंग स्वैच",
        "proPro3": "प्रश्नोत्तर",
    }
    for k, v in cg_fixes.items():
        HI["colorGuide"][k] = v

    with open(MESSAGES / "hi.json", "w", encoding="utf-8") as f:
        json.dump(HI, f, ensure_ascii=False, indent=2)
        f.write("\n")

    json.load(open(MESSAGES / "hi.json", encoding="utf-8"))

    bad = []
    for section in ("sd", "ad"):
        for cat, data in HI[section].items():
            for k, v in data.items():
                eng = find_english(v)
                if eng:
                    bad.append(f"{section}.{cat}.{k}: {eng}")

    updated = sum(len(v) for v in SD.values()) + sum(len(v) for v in AD.values()) + len(cg_fixes)
    print(f"Updated {updated} keys")
    if bad:
        print(f"WARNING: {len(bad)} values still contain English:")
        for b in bad[:50]:
            print(f"  {b}")
        if len(bad) > 50:
            print(f"  ... and {len(bad) - 50} more")
    else:
        print("All values pass English check")


if __name__ == "__main__":
    main()
