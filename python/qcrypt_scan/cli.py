"""CLI wrapper that delegates to the Node.js qcrypt-scan package."""

import os
import sys
import shutil
import subprocess
from pathlib import Path

PACKAGE_NAME = "qcrypt-scan"
CACHE_DIR = Path.home() / ".qcrypt" / "node_pkg"
NPX_FALLBACK = True


def _find_npx() -> str | None:
    """Find npx in PATH."""
    return shutil.which("npx")


def _find_node() -> str | None:
    """Find node in PATH."""
    return shutil.which("node")


def _ensure_installed() -> Path:
    """Ensure the npm package is installed in the cache directory."""
    pkg_dir = CACHE_DIR / "node_modules" / PACKAGE_NAME
    cli_path = pkg_dir / "dist" / "cli.js"

    if cli_path.exists():
        return cli_path

    node = _find_node()
    if not node:
        print(
            "Error: Node.js is required but not found.\n"
            "Install Node.js 18+ from https://nodejs.org/\n"
            "Or use: brew install node / apt install nodejs",
            file=sys.stderr,
        )
        sys.exit(1)

    # Install the npm package to cache
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Installing {PACKAGE_NAME}...", file=sys.stderr)
    result = subprocess.run(
        ["npm", "install", "--prefix", str(CACHE_DIR), PACKAGE_NAME],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        # Fallback: try npx
        print(f"npm install failed, will use npx fallback", file=sys.stderr)
        return Path("")

    if cli_path.exists():
        return cli_path

    return Path("")


def main() -> None:
    """Entry point: delegate all args to the Node.js CLI."""
    args = sys.argv[1:]

    # Strategy 1: Use cached installation
    cli_path = _ensure_installed()
    if cli_path.exists():
        node = _find_node()
        if node:
            result = subprocess.run([node, str(cli_path)] + args)
            sys.exit(result.returncode)

    # Strategy 2: Use npx (always available if Node.js is installed)
    npx = _find_npx()
    if npx:
        result = subprocess.run([npx, PACKAGE_NAME] + args)
        sys.exit(result.returncode)

    # No Node.js at all
    print(
        "Error: Node.js is required to run qcrypt-scan.\n"
        "\n"
        "Install options:\n"
        "  macOS:   brew install node\n"
        "  Ubuntu:  sudo apt install nodejs npm\n"
        "  Windows: https://nodejs.org/\n"
        "  Any:     https://nodejs.org/en/download/\n"
        "\n"
        "After installing Node.js, run: qcrypt-scan --help",
        file=sys.stderr,
    )
    sys.exit(1)


if __name__ == "__main__":
    main()
