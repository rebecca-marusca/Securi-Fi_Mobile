<p align="center">
  <img src="mobile-app/assets/images/securi-fi-logo.png" alt="Securi-Fi Logo" width="200" />
</p>

<h1 align="center">Securi-Fi</h1>

<p align="center">
  <strong>Intuitive by design. Private by nature.</strong>
</p>


---

## Table of Contents

- [About Securi-Fi](#about-securi-fi)
- [Built for DPIT](#built-for-dpit)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [How Commands Work](#how-commands-work)
- [Tech Stack](#tech-stack)
- [Related Repositories](#related-repositories)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Usage Examples](#usage-examples)
- [Known Limitations](#known-limitations)
- [Team](#team)
- [Documentation and Support](#documentation-and-support)
- [License](#license)

---

## About Securi-Fi

Every home security system available today relies on compromises: it offers the protection you need while sacrificing reliability, privacy, or comfort. We noticed this a couple of months ago, and Securi-Fi is our answer to it.

By repurposing the Wi-Fi already present in your home, Securi-Fi provides the same level of protection without disrupting your daily life. It is an easy-to-install, easy-to-use four-node mesh system that reimagines Wi-Fi traffic as a through-wall motion detector. Simply put, it identifies the intruder without ever needing to see them.

**No cameras. Easy to install. Private by design.**

Beyond intrusions, the nodes also monitor for fire and gas hazards. When something is detected, homeowners receive a push notification and a live alert screen with real-time diagnostics, an incident timeline, and controls to raise an emergency response or dismiss a verified false alarm.

This repository contains the **mobile app** (React Native / Expo) and the **REST backend** (FastAPI). The firmware and the ingestion server live in separate repositories, linked [below](#related-repositories).

---

## Built for DPIT

Securi-Fi is a six-person team project built over three months for **DPIT**, a Romanian high school technology competition. The work is split across hardware firmware, an ingestion server, and the mobile app, which is why the system is spread over three repositories that share a single Firebase project.

---

## Key Features

- **Interactive spatial node map**: view room-by-room sensor placement with real-time indicators for armed status, motion activity, and link quality.
- **Multi-hazard detection**: real-time events for intrusions, fire hazards, and gas leaks.
- **Granular arming controls**: arm or disarm the entire home in one tap, or control individual nodes room by room.
- **Critical alert interface**: a high-priority alert screen with haptic feedback, active event details, and incident dismissal.
- **Live feed**: a dedicated full-screen, second-by-second play-by-play while an event is active.
- **Event timeline**: a chronological history of past events with condensed summaries and false-alarm classification.
- **Remote node management**: monitor battery level, detect defective nodes, rename nodes, and send remote restart or shutdown commands.
- **Secure home pairing**: pair a home to its master node using MAC address verification and Firebase Authentication.

---

## System Architecture

The app and backend never communicate with the ingestion server or hardware directly. **Firestore serves as the central state hub and handoff point** for the entire system.

### Core Components & Responsibilities

- **Hardware Layer (ESP32-C6 Mesh)**: Multiple slave nodes communicate with a central master node via ESP-NOW. The master node bridges the local mesh network to the cloud.
- **Ingestion Server (Python + `paho-mqtt`)**: Listens to real-time telemetry sent over MQTT from the master node and synchronizes event/device status into Cloud Firestore using the Firebase Admin SDK.
- **Cloud Infrastructure (Firebase & Cloudinary)**: 
  - **Cloud Firestore**: Holds real-time data for nodes, active hazards, and system requests.
  - **Firebase Cloud Messaging (FCM)**: Delivers push alerts to mobile users.
  - **Firebase Auth**: Secures REST API calls and Firestore access.
  - **Cloudinary**: Handles direct, unsigned media uploads from the app.
- **App Backend (FastAPI)**: Validates incoming request payloads, updates command requests in Firestore, and triggers FCM push notifications to clients during security events.
- **Mobile Client (React Native / Expo)**: Communicates with the FastAPI backend over REST using Firebase ID tokens and attaches directly to Firestore real-time snapshot listeners for live status updates.

### End-to-End Data Flow

1. **Telemetry & Detection**: Hardware nodes detect motion or hazards, send packet data over ESP-NOW to the master node, which forwards it via MQTT to the Ingestion Server.
2. **State Updates**: The Ingestion Server parses telemetry and writes state changes directly to Cloud Firestore.
3. **Alert Dispatch**: When a hazard is written to Firestore, the FastAPI backend sends a push notification to the user's mobile device via FCM.
4. **Client Synchronization**: The Mobile App receives real-time UI updates automatically via snapshot listeners attached to Firestore.

---

## How Commands Work

Arm, disarm, restart, and shutdown all follow a **request, then confirm** pattern, so the app never shows a state the hardware has not actually reached.

1. The app calls the backend, which sets a request flag on the node's Firestore document (`requestedArmed`, `requestedRestart`, or `requestedShutDown`).
2. The ingestion server's snapshot listener sees the request and sends an MQTT command to the master node.
3. The master relays it to the target slave over ESP-NOW, or acts on it locally if it is the target.
4. The device confirms back up the chain, and the server updates the node's real state.
5. If the command fails or times out, the server reverts the request so the app reflects reality.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile app | React Native, Expo SDK 57, TypeScript, Expo Router |
| Firebase client | `@react-native-firebase` v26 (modular API) |
| Backend | FastAPI, Pydantic, `firebase-admin` |
| Ingestion server | FastAPI, `paho-mqtt`, `firebase-admin` |
| Data and messaging | Cloud Firestore, Firebase Authentication, Firebase Cloud Messaging |
| Media | Cloudinary (unsigned uploads) |
| Hardware | ESP32-C6, MicroPython, ESP-NOW, MQTT |
| Hosting | Render (backend, free tier) |

---

## Related Repositories

Securi-Fi is made of three repositories that share one Firebase project:

| Repository | Purpose |
| --- | --- |
| [Securi-Fi-Mobile](https://github.com/rebecca-marusca/Securi-Fi-Mobile) (this repo) | Mobile app and REST backend |
| [Securi-Fi_Server](https://github.com/gbl08/Securi-Fi_Server) | Ingestion and command server (MQTT and Firestore) |
| [Securi-Fi_Hardware](https://github.com/rebecca-marusca/Securi-Fi_Hardware) | ESP32-C6 firmware for the master and slave nodes |

---

## Repository Structure

```text
Securi-Fi-Mobile/
├── backend/
│   ├── routers/
│   ├── database.py
│   ├── deps.py
│   ├── schemas.py
│   ├── main.py
│   └── requirements.txt
├── mobile-app/
│   ├── assets/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── theme/
│   │   └── types/
│   ├── app.json
│   └── package.json
├── LICENSE
└── README.md
```

---

## Getting Started

> **Note on onboarding:** the in-app hardware onboarding flow (BLE pairing while on home Wi-Fi, then the node joining the home network) is still in development. For now, a home is paired by submitting the master node's MAC address, as shown in [Usage Examples](#1-pairing-a-device).

### Prerequisites

- **Node.js** v20 or later, with `npm`
- **Python** 3.10 or later
- **Android Studio** for Android builds, or **Xcode** (macOS only) for iOS builds. iOS runs, but push notifications are not supported (see [Known Limitations](#known-limitations)).
- Your own **Firebase project** with Firestore, Authentication (Email/Password), and Cloud Messaging enabled

### Backend Setup

1. **Create a virtual environment**:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate    # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Firebase credentials**:
   Generate a service account key in the Firebase Console (*Project Settings > Service accounts > Generate new private key*), then either save it as `backend/serviceAccountKey.json` or export it as an environment variable:
   ```bash
   export FIREBASE_CREDENTIALS='{"type": "service_account", ...}'
   ```
   The key is a secret. Never commit it; make sure `serviceAccountKey.json` is in your `.gitignore`.

4. **Seed the database (optional, for local testing)**:
   ```bash
   python seed/seed_all.py
   ```

5. **Start the server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API runs at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

The production backend runs on Render's free tier, so the first request after a period of inactivity may be slow while the service wakes up.

### Mobile App Setup

1. **Install dependencies**:
   ```bash
   cd mobile-app
   npm install
   ```

2. **Add Firebase configuration files**:
   - iOS: place `GoogleService-Info.plist` in `mobile-app/`
   - Android: place `google-services.json` in `mobile-app/`

3. **Point the app at your backend** with an environment variable. If it is not set, the app falls back to the deployed backend URL.
   ```bash
   export EXPO_PUBLIC_API_URL="http://localhost:8000"
   ```

4. **Run the app**:
   ```bash
   npm start          # Expo development server
   npm run android    # Android
   npm run ios        # iOS (development client or simulator)
   ```

---

## Usage Examples

### 1. Pairing a Device

A home is paired to its master node by MAC address (authenticated with a Firebase ID token):

```bash
curl -X POST "http://localhost:8000/homes/pair" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"master_mac": "58:E6:C5:12:05:E0"}'
```

### 2. Arming and Disarming Nodes

```typescript
import { armNode, disarmNode } from '@/services/nodes';

await armNode(homeId, nodeId);
await disarmNode(homeId, nodeId);
```

Both calls create a request that the hardware must confirm (see [How Commands Work](#how-commands-work)).

### 3. Dismissing an Alert

Once an incident is resolved, the homeowner can dismiss it and optionally flag it as a false alarm:

```bash
curl -X POST "http://localhost:8000/homes/{hid}/events/{eid}/dismiss" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"falseAlarm": true, "falseAlarmDescription": "Sensor triggered by family pet"}'
```

---

## Known Limitations

- **iOS push notifications are not supported.** Push registration is skipped on iOS because it requires a paid Apple Developer account. Android is supported.
- **Onboarding is manual for now.** See the note under [Getting Started](#getting-started).
- **Free-tier hosting.** The Render backend can take a moment to respond after being idle.

---

## Team

| Name | Role |
| --- | --- |
| Rebecca Mărușca | Team Lead, Lead Software Developer |
| Natalia Pal-Șerban | Full-stack Developer |
| Ștefan Neamț | Lead Hardware Developer |
| Gabriel Predescu | Embedded Systems Developer |
| Alex Chiș | Mechanical Designer |
| Luca Lupșan | QA/Tester |

---

## Documentation and Support

- **API documentation**: run the backend and open `http://localhost:8000/docs` (Swagger UI) or `http://localhost:8000/redoc`.
- **Bug reports**: open an issue on [GitHub Issues](https://github.com/rebecca-marusca/Securi-Fi-Mobile/issues).

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
