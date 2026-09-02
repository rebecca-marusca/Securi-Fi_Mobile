"""
seed_all.py — runs all seed scripts in the correct dependency order:
home -> nodes -> cache -> events -> event chunks.

Usage:
    pip install firebase-admin --break-system-packages
    python3 seed_all.py
"""

import seed_home
import seed_nodes
import seed_cache
import seed_events
import seed_event_chunks

if __name__ == "__main__":
    seed_home.main()
    seed_nodes.main()
    seed_cache.main()
    seed_events.main()
    seed_event_chunks.main()
    print("Done — home, nodes, cache, events, and event chunks all seeded.")
