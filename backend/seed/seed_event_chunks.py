"""
seed_event_chunks.py — adds fake chunk subcollections to timeline events.

Usage:
    cd backend/seed
    python3 seed_event_chunks.py

Run seed_events.py first if you do not already have events under:
    home_events/{HID}/events/{eid}
"""

from datetime import timedelta
from typing import Optional

from seed_config import db, HID, NODE_IDS


def build_node_reading(
    node_id: str,
    movement_pct: int,
    *,
    state: str = "monitoring",
    raw_mq2_reading: float = 118.0,
    is_alarm: bool = False,
    flame: bool = False,
    gas: bool = False,
    battery_pct: int = 92,
) -> dict:
    return {
        "nodeId": node_id,
        "state": state,
        "movementPct": movement_pct,
        "rawMq2Reading": raw_mq2_reading,
        "isAlarm": is_alarm,
        "sensors": {
            "flame": flame,
            "gas": gas,
            "batteryPct": battery_pct,
        },
    }


def build_package(event_start, seconds_after: int, warning_type: Optional[str], node_readings: list[dict]) -> dict:
    return {
        "timestamp": (event_start + timedelta(seconds=seconds_after)).isoformat(),
        "warningType": warning_type,
        "packageMovementPct": max((node["movementPct"] for node in node_readings), default=0),
        "isAlarm": any(node["isAlarm"] for node in node_readings),
        "nodes": node_readings,
    }


def intrusion_chunks(event_start) -> list[dict]:
    return [
        {
            "savedAt": event_start + timedelta(seconds=30),
            "packages": [
                build_package(
                    event_start,
                    4,
                    "movement_detected",
                    [
                        build_node_reading(NODE_IDS[0], 21, state="movement"),
                        build_node_reading(NODE_IDS[1], 8),
                    ],
                ),
                build_package(
                    event_start,
                    18,
                    "intrusion_suspected",
                    [
                        build_node_reading(NODE_IDS[0], 64, state="alarm", is_alarm=True),
                        build_node_reading(NODE_IDS[1], 36, state="movement"),
                    ],
                ),
            ],
        },
        {
            "savedAt": event_start + timedelta(seconds=90),
            "packages": [
                build_package(
                    event_start,
                    44,
                    "movement_persisted",
                    [
                        build_node_reading(NODE_IDS[0], 73, state="alarm", is_alarm=True),
                        build_node_reading(NODE_IDS[2], 19, state="movement"),
                    ],
                ),
                build_package(
                    event_start,
                    71,
                    "scene_stabilized",
                    [
                        build_node_reading(NODE_IDS[0], 12),
                        build_node_reading(NODE_IDS[1], 5),
                    ],
                ),
            ],
        },
    ]


def false_alarm_intrusion_chunks(event_start) -> list[dict]:
    return [
        {
            "savedAt": event_start + timedelta(seconds=35),
            "packages": [
                build_package(
                    event_start,
                    6,
                    "movement_detected",
                    [
                        build_node_reading(NODE_IDS[1], 29, state="movement"),
                        build_node_reading(NODE_IDS[2], 11),
                    ],
                ),
                build_package(
                    event_start,
                    22,
                    "intrusion_suspected",
                    [
                        build_node_reading(NODE_IDS[1], 48, state="alarm", is_alarm=True),
                        build_node_reading(NODE_IDS[2], 14),
                    ],
                ),
            ],
        },
        {
            "savedAt": event_start + timedelta(seconds=70),
            "packages": [
                build_package(
                    event_start,
                    52,
                    "dismissed_by_user",
                    [
                        build_node_reading(NODE_IDS[1], 6),
                        build_node_reading(NODE_IDS[2], 3),
                    ],
                ),
            ],
        },
    ]


def fire_chunks(event_start) -> list[dict]:
    return [
        {
            "savedAt": event_start + timedelta(seconds=40),
            "packages": [
                build_package(
                    event_start,
                    8,
                    "flame_detected",
                    [
                        build_node_reading(NODE_IDS[0], 3, state="alarm", is_alarm=True, flame=True, raw_mq2_reading=312.5),
                        build_node_reading(NODE_IDS[1], 1),
                    ],
                ),
                build_package(
                    event_start,
                    31,
                    "fire_risk_confirmed",
                    [
                        build_node_reading(NODE_IDS[0], 4, state="alarm", is_alarm=True, flame=True, raw_mq2_reading=336.8),
                        build_node_reading(NODE_IDS[2], 2),
                    ],
                ),
            ],
        }
    ]


def gas_leak_chunks(event_start) -> list[dict]:
    return [
        {
            "savedAt": event_start + timedelta(seconds=45),
            "packages": [
                build_package(
                    event_start,
                    7,
                    "gas_detected",
                    [
                        build_node_reading(NODE_IDS[2], 4, state="alarm", raw_mq2_reading=540.2, is_alarm=True, gas=True),
                        build_node_reading(NODE_IDS[0], 2),
                    ],
                ),
                build_package(
                    event_start,
                    28,
                    "gas_level_rising",
                    [
                        build_node_reading(NODE_IDS[2], 5, state="alarm", raw_mq2_reading=588.9, is_alarm=True, gas=True),
                        build_node_reading(NODE_IDS[1], 2),
                    ],
                ),
            ],
        }
    ]


def chunks_for_event(event: dict) -> list[dict]:
    event_start = event["startedAt"]
    event_type = event["eventType"]

    if event_type == "fire":
        return fire_chunks(event_start)
    if event_type == "gasLeak":
        return gas_leak_chunks(event_start)
    if event.get("falseAlarm"):
        return false_alarm_intrusion_chunks(event_start)
    return intrusion_chunks(event_start)


def main():
    events_ref = db.collection("home_events").document(HID).collection("events")
    events = list(events_ref.stream())

    if not events:
        print(f"No events found under home_events/{HID}/events. Run seed_events.py first.")
        return

    batch = db.batch()
    chunk_count = 0

    for event_doc in events:
        event = event_doc.to_dict()
        for index, chunk in enumerate(chunks_for_event(event), start=1):
            chunk_ref = event_doc.reference.collection("chunks").document(f"fake_chunk_{index}")
            batch.set(chunk_ref, chunk)
            chunk_count += 1

    batch.commit()
    print(f"Seeded {chunk_count} chunks into {len(events)} events under home_events/{HID}/events/*/chunks")


if __name__ == "__main__":
    main()
