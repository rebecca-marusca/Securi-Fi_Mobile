"""
seed_all.py — runs all seed scripts in the correct dependency order:
home -> nodes -> cache -> events.

Usage:
    pip install firebase-admin --break-system-packages
    python seed_all.py
"""

import seed_home
import seed_nodes
import seed_cache
import seed_events

if __name__ == "__main__":
    seed_home.main()
    seed_nodes.main()
    seed_cache.main()
    seed_events.main()
    print("Done — home, nodes, cache, and events all seeded.")