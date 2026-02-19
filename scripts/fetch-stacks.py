import urllib.request, ssl, re, json, os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

STACKS = [
    ("stack1", "https://docs.google.com/document/d/e/2PACX-1vSoTZMzfr5qYKgqtpLrzuLTcqYsoTOYvJ4XFVp5IOy6vgsng1cfKXXbYjAuYRfL8mcYzfPULnjc4a8R/pub"),
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

out_dir = os.path.join(os.path.dirname(__file__), "..", "data")

for stack_id, url in STACKS:
    print(f"\nFetching {stack_id} ...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        html_path = os.path.join(out_dir, f"{stack_id}-pub.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  HTML length: {len(html)}")
        imgs = re.findall(r'src="(https://[^"]+)"', html)
        imgs = [u for u in imgs if "google" in u.lower() or "ggpht" in u.lower() or "googleusercontent" in u.lower() or "lh" in u.lower()]
        print(f"  Images found: {len(imgs)}")
        for i, img_url in enumerate(imgs):
            print(f"    {i+1}: {img_url[:160]}")
        # Save image list
        img_path = os.path.join(out_dir, f"{stack_id}-images.json")
        with open(img_path, "w") as f:
            json.dump({"stack": stack_id, "url": url, "images": imgs}, f, indent=2)
    except Exception as e:
        print(f"  ERROR: {e}")

print("\nDone.")
