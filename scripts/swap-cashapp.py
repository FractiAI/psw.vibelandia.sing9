#!/usr/bin/env python3
"""
Swap all PayPal references to Cash App across the SING 9 codebase.
Cash App: https://cash.app/$newearthpru
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXTS = {'.html', '.txt', '.json', '.yaml', '.yml', '.md', '.js', '.mjs'}

REPLACEMENTS = [
    # --- Payment URLs ---
    ("https://www.paypal.com/paypalme/vibelandia/", "https://cash.app/$newearthpru/"),
    ("https://www.paypal.com/paypalme/vibelandia",  "https://cash.app/$newearthpru"),
    ("https://paypal.me/vibelandia/",               "https://cash.app/$newearthpru/"),
    ("https://paypal.me/vibelandia",                "https://cash.app/$newearthpru"),
    ("paypal.com/paypalme/vibelandia",              "cash.app/$newearthpru"),

    # --- PayPal brand colors → Cash App green ---
    ("background:#0070ba", "background:#00D632"),
    ("background: #0070ba", "background: #00D632"),
    ("#0070ba", "#00D632"),
    ("#003087", "#00a825"),
    ("rgba(0,112,186,", "rgba(0,214,50,"),

    # --- Button icons ---
    ("\U0001f499", "\U0001f49a"),  # 💙 → 💚

    # --- Text labels (longer strings first to avoid partial matches) ---
    ("Blue Cash App Pipe",            "Green Cash App Pipe"),
    ("Blue Cash App pipe",            "Green Cash App pipe"),
    ("Blue PayPal Pipe",              "Green Cash App Pipe"),
    ("Blue PayPal pipe",              "Green Cash App pipe"),
    ("blue PayPal pipe",              "green Cash App pipe"),
    ("blue PayPal Pipe",              "green Cash App pipe"),
    ("Cash App pipe active",          "Cash App pipe active"),  # already done; no-op guard
    ("PayPal pipe active",            "Cash App pipe active"),
    ("Cash App pipe open",            "Cash App pipe open"),
    ("PayPal pipe open",              "Cash App pipe open"),
    ("PayPal pipe",                   "Cash App pipe"),
    ("PayPal Pipe",                   "Cash App Pipe"),
    ("Auto · PayPal · No human",      "Auto · Cash App · No human"),
    ("via PayPal",                    "via Cash App"),
    ("pay via PayPal",                "pay via Cash App"),
    ("paid via PayPal",               "paid via Cash App"),
    ("close via PayPal",              "close via Cash App"),
    ("closes via PayPal",             "closes via Cash App"),
    ("close automatically via PayPal","close automatically via Cash App"),
    ("closes automatically via PayPal","closes automatically via Cash App"),
    ("auto-close via PayPal",         "auto-close via Cash App"),
    ("Auto-Close · PayPal",           "Auto-Close · Cash App"),
    ("Auto-close via PayPal",         "Auto-close via Cash App"),
    ("Cash App transaction",          "Cash App transaction"),  # guard
    ("PayPal transaction",            "Cash App transaction"),
    ("Cash App payment",              "Cash App payment"),      # guard
    ("PayPal payment",                "Cash App payment"),
    ("Cash App button",               "Cash App button"),       # guard
    ("PayPal button",                 "Cash App button"),
    ("Cash App-only",                 "Cash App-only"),         # guard
    ("PayPal-only",                   "Cash App-only"),
    ("PayPal only",                   "Cash App only"),
    ("Cash App wallets",              "Cash App wallets"),      # guard
    ("PayPal wallets",                "Cash App wallets"),
    ("Wallets ready · Cash App",      "Wallets ready · Cash App"), # guard
    ("Wallets ready · PayPal",        "Wallets ready · Cash App"),
    ("wallets ready paypal",          "wallets ready Cash App"),
    ("PayPal IPN",                    "Cash App webhook"),
    ("PayPal SDK",                    "Cash App"),
    ("PayPal client",                 "Cash App"),
    ("PayPal auto close",             "Cash App auto close"),
    ("PayPal services",               "Cash App services"),
    ("Cash App: https://cash",        "Cash App: https://cash"), # guard
    ("PayPal: https://cash",          "Cash App: https://cash"),
    ("Cash App · No Human",           "Cash App · No Human"),   # guard
    ("PayPal · No Human",             "Cash App · No Human"),
    ("PayPal · No human",             "Cash App · No human"),
    # Meta / title tags
    ("· PayPal ·",                    "· Cash App ·"),
    ("· PayPal",                      "· Cash App"),
    # Generic remaining
    ("PayPal",                        "Cash App"),
]

SKIP_DIRS = {'.git', '.vercel', 'node_modules', '__pycache__'}

updated = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fname in filenames:
        if os.path.splitext(fname)[1].lower() not in EXTS:
            continue
        fpath = os.path.join(dirpath, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            continue
        new = content
        for old, rep in REPLACEMENTS:
            new = new.replace(old, rep)
        if new != content:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new)
            updated.append(os.path.relpath(fpath, ROOT))

print(f"Updated {len(updated)} files:")
for u in updated:
    print(f"  {u}")
