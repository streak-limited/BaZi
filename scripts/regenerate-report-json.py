#!/usr/bin/env python3
"""Regenerate refereence/ai_generated_content.json from p1-p20 HTML."""

import re
import json
import html as htmlmod
from pathlib import Path
from collections import defaultdict
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "refereence"


def extract_text_from_html(html_block: str) -> str:
    body = re.sub(r'<div class="h-\d+"></div>', "\n", html_block)
    body = re.sub(r"<[^>]+>", "", body)
    return htmlmod.unescape(re.sub(r"\s+", " ", body).strip())


def extract_mzmudang(combined: str) -> list[dict]:
    """h3 titles = static template; body paragraphs = AI."""
    entries = []
    for m in re.finditer(r'class="mzmudang-content[^"]*"[^>]*>(.*)', combined, re.S | re.I):
        html_block = m.group(1)
        for em in ['<div class="fixed', '<div class="sticky', "</main>"]:
            pos = html_block.find(em)
            if pos > 0:
                html_block = html_block[:pos]
        prose_m = re.search(r"font-\['Pretendard'\][^>]*>(.*)", html_block, re.S)
        if not prose_m:
            continue
        content_html = prose_m.group(1)

        pre = re.split(r"<h3[^>]*>", content_html, maxsplit=1)[0]
        pre_text = extract_text_from_html(pre)
        if pre_text and len(pre_text) > 30:
            entries.append(
                {
                    "type": "ai",
                    "description": "AI 章節開場導語（依用戶資料客製）",
                    "content": pre_text,
                }
            )

        parts = re.split(r"<h3[^>]*>([^<]+)</h3>", content_html)
        i = 1
        while i < len(parts):
            title = parts[i].strip()
            body = extract_text_from_html(parts[i + 1] if i + 1 < len(parts) else "")
            if title:
                entries.append(
                    {
                        "type": "static",
                        "description": f"區塊小標題（固定模板）：{title}",
                        "content": title,
                    }
                )
            if body and len(body) > 30:
                entries.append(
                    {
                        "type": "ai",
                        "description": f"AI 分析內文：{title}",
                        "content": body,
                    }
                )
            i += 2
    return entries


def is_computed_image(src: str) -> bool:
    sl = src.lower()
    return "1-percent" in sl or "/saju/" in sl


def resolve_image_url(url: str) -> str:
    if url.startswith("/_next/image"):
        m = re.search(r"url=([^&]+)", url)
        if m:
            return unquote(m.group(1))
    return url


def parse_page(num: int) -> list[dict]:
    text = (REF / f"p{num}").read_text(encoding="utf-8", errors="ignore")
    main_m = re.search(r"<main[^>]*>(.*?)</main>", text, re.S | re.I)
    combined = main_m.group(1) if main_m else text
    entries: list[dict] = []

    for m in re.finditer(r"<p[^>]*font-\['Song_myung'\][^>]*>(.*?)</p>", combined, re.S | re.I):
        t = htmlmod.unescape(re.sub(r"<[^>]+>", "", m.group(1)).strip())
        if t:
            entries.append({"type": "static", "description": "章節/段落標籤（固定模板）", "content": t})

    for m in re.finditer(r"<h2[^>]*>(.*?)</h2>", combined, re.S | re.I):
        t = htmlmod.unescape(re.sub(r"<[^>]+>", "", m.group(1)).strip())
        if t and re.search(r"[\u4e00-\u9fff]", t) and len(t) <= 8:
            entries.append({"type": "computed", "description": "用戶姓名（用戶輸入）", "content": t})
        elif t:
            entries.append({"type": "static", "description": "頁面主標題（固定模板）", "content": t})

    for m in re.finditer(r'<p[^>]*text-center[^>]*>(.*?)</p>', combined, re.S | re.I):
        t = htmlmod.unescape(re.sub(r"<[^>]+>", "", m.group(1)).strip())
        if t and len(t) > 5 and not re.search(r"[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]年", t):
            entries.append({"type": "static", "description": "章節開場標語（固定模板）", "content": t})

    for m in re.finditer(
        r'<span[^>]*>([^<]*(?:👹|✂️|📈|💔|🔥|🍎|🧧|🪓|💊|🚨|🧑|VIP|🚫)[^<]*)</span>',
        combined,
    ):
        t = m.group(1).strip()
        if len(t) > 8:
            entries.append({"type": "static", "description": "章節目錄項目（固定模板）", "content": t})

    for m in re.finditer(r'<p[^>]*class="[^"]*text-sm[^"]*"[^>]*>(.*?)</p>', combined, re.S | re.I):
        t = htmlmod.unescape(re.sub(r"<[^>]+>", "", m.group(1)).strip())
        if t and re.match(r"^\d+\.", t):
            entries.append({"type": "static", "description": "小節標題（固定模板）", "content": t})

    for m in re.finditer(r'<h3 class="text-lg[^"]*"[^>]*>([^<]+)</h3>', combined):
        start = m.start()
        chunk = combined[max(0, start - 500) : start]
        if "mzmudang-content" in chunk and "font-['Pretendard']" in chunk:
            continue
        title = m.group(1).strip()
        entries.append(
            {"type": "static", "description": f"區塊小標題（固定模板）：{title}", "content": title}
        )

    seen_src: set[str] = set()
    for m in re.finditer(r"<img([^>]+)>", combined, re.I):
        src_m = re.search(r'src="([^"]*)"', m.group(1))
        if not src_m:
            continue
        src = resolve_image_url(htmlmod.unescape(src_m.group(1)))
        if "adsct" in src or "analytics" in src or "t.co/" in src:
            continue
        if src in seen_src:
            continue
        seen_src.add(src)
        alt_m = re.search(r'alt="([^"]*)"', m.group(1))
        alt = alt_m.group(1) if alt_m else src.split("/")[-1].split("?")[0]
        itype = "computed" if is_computed_image(src) else "static"
        desc = (
            f"命盤圖（DOB 計算，alt={alt}）"
            if itype == "computed"
            else f"固定插圖（alt={alt}）"
        )
        entries.append(
            {"type": itype, "description": desc, "content": alt, "image_url": src}
        )

    for m in re.finditer(
        r"url=https%3A%2F%2F[^\"']+",
        combined,
    ):
        import urllib.parse

        url_part = m.group(0).split("url=")[1].split("&")[0]
        full = urllib.parse.unquote(url_part)
        if full in seen_src or "adsct" in full:
            continue
        seen_src.add(full)
        alt_m2 = re.search(r'alt="([^"]*)"', combined[max(0, m.start() - 200) : m.start() + 200])
        alt = alt_m2.group(1) if alt_m2 else full.split("/")[-1]
        itype = "computed" if is_computed_image(full) else "static"
        entries.append(
            {
                "type": itype,
                "description": f"{'命盤圖' if itype == 'computed' else '插圖'}（Next/Image）",
                "content": alt,
                "image_url": full,
            }
        )

    for m in re.finditer(r"(\d{4}\.\d{2}\.\d{2},?\s*\d{1,2}:\d{2})", combined):
        entries.append({"type": "computed", "description": "出生日期時間（用戶輸入）", "content": m.group(1)})
    for m in re.finditer(
        r"([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]年\s*"
        r"[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]月\s*"
        r"[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日\s*"
        r"[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]時)",
        combined,
    ):
        entries.append({"type": "computed", "description": "八字四柱（DOB 計算）", "content": m.group(1)})
    for m in re.finditer(r"([\u4e00-\u9fff]{2,6})\s*\(我\)", combined):
        entries.append({"type": "computed", "description": "命盤標示姓名", "content": m.group(0)})

    chart_end = combined.find("mzmudang-content")
    chart = combined[:chart_end] if chart_end > 0 else combined[:50000]
    for label in [
        "傷官", "食神", "偏財", "正財", "偏印", "正印", "比肩", "劫財",
        "正官", "七殺", "日干(我)", "長生", "建祿", "驛馬煞", "劫煞", "地煞",
    ]:
        if label in chart:
            entries.append(
                {"type": "computed", "description": "命盤十神/神煞標籤", "content": label}
            )

    entries.extend(extract_mzmudang(combined))

    seen: set[tuple] = set()
    deduped = []
    for e in entries:
        key = (e["type"], e.get("image_url", ""), str(e.get("content", ""))[:250])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(e)

    result = []
    for i, e in enumerate(deduped, 1):
        item = {
            "page": num,
            "display_order": i,
            "type": e["type"],
            "description": e["description"],
            "content": e["content"],
        }
        if "image_url" in e:
            item["image_url"] = e["image_url"]
        result.append(item)
    return result


def main():
    all_entries = []
    page_stats = {}
    for num in range(1, 21):
        items = parse_page(num)
        all_entries.extend(items)
        page_stats[str(num)] = {
            "static": sum(1 for x in items if x["type"] == "static"),
            "computed": sum(1 for x in items if x["type"] == "computed"),
            "ai": sum(1 for x in items if x["type"] == "ai"),
            "total": len(items),
            "with_image_url": sum(1 for x in items if "image_url" in x),
        }

    output = {
        "metadata": {
            "source": "mzmudang-tw BaZi report HTML export (p1-p20)",
            "type_legend": {
                "static": "固定模板文字、區塊標題或裝飾圖（所有用戶相同）",
                "computed": "由用戶輸入/八字規則計算（非 LLM）",
                "ai": "AI prompt 生成的敘述內文（mzmudang-content 內段落）",
            },
            "classification_note": "mzmudang-content 內的 h3 為固定模板標題；僅標題下長文為 AI",
            "user_inputs": ["dob_time", "sexuality", "name", "job_status", "gender"],
            "sample_subject": {
                "name": "温曉峰",
                "dob": "1995.08.09 10:10",
                "pillars": "乙亥年 甲申月 壬申日 乙巳時",
                "job": "自己做生意",
                "relationship": "有對象",
            },
            "total_entries": len(all_entries),
            "by_type": {
                t: sum(1 for x in all_entries if x["type"] == t)
                for t in ["static", "computed", "ai"]
            },
            "page_summary": page_stats,
        },
        "entries": all_entries,
    }

    out = REF / "ai_generated_content.json"
    out.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(all_entries)} entries to {out}")
    print("by_type:", output["metadata"]["by_type"])


if __name__ == "__main__":
    main()

PYEOF