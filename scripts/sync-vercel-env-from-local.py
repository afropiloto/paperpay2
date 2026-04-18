#!/usr/bin/env python3
"""Push selected env vars from .env.local to Vercel (production + preview)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.local"
VERCEL_BIN = ROOT / "node_modules" / ".bin" / "vercel"
SCOPE = "paperless-money"

# Keys read from .env.local (do not sync unused secrets).
KEYS_FROM_FILE = (
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "THREESIXTY_DIALOG_API_KEY",
)

# Production-facing overrides (not necessarily in .env.local).
OVERRIDES = {
    "NEXT_PUBLIC_APP_URL": "https://paperless.money",
    "ADMIN_EMAIL": "ops@paperless.money,lee@paperless.money",
    "CLEARING_EMAIL": "Melvin.thoppil@clearing.com",
}


def parse_dotenv(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        out[k] = v
    return out


def vercel_env_add(key: str, target: str, value: str) -> None:
    if not VERCEL_BIN.is_file():
        print(f"Missing {VERCEL_BIN} — run: npm install", file=sys.stderr)
        sys.exit(1)
    sensitive = not key.startswith("NEXT_PUBLIC_")
    cmd = [
        str(VERCEL_BIN),
        "env",
        "add",
        key,
        target,
        "--value",
        value,
        "--yes",
        "--force",
        "--scope",
        SCOPE,
    ]
    if sensitive:
        cmd.insert(-2, "--sensitive")
    r = subprocess.run(
        cmd,
        cwd=ROOT,
        stdin=subprocess.DEVNULL,
    )
    if r.returncode != 0:
        sys.exit(r.returncode)


def main() -> None:
    if not ENV_PATH.is_file():
        print(f"Missing {ENV_PATH}", file=sys.stderr)
        sys.exit(1)
    data = parse_dotenv(ENV_PATH)
    merged: dict[str, str] = {}
    for k in KEYS_FROM_FILE:
        if k not in data:
            print(f"Missing {k} in .env.local", file=sys.stderr)
            sys.exit(1)
        merged[k] = data[k]
    merged.update(OVERRIDES)
    # Production only: CLI preview targeting requires a non-production-branch git ref.
    for key, value in merged.items():
        vercel_env_add(key, "production", value)


if __name__ == "__main__":
    main()
