# Always-On-Security

A distributed, container-based security monitoring simulation that demonstrates real-time anomaly detection, cumulative risk scoring, automated quarantine, and live dashboard visualization.

---

## Architecture Overview

The system is built as a multi-container Docker application with the following layers:

1. **Layer 1: Node Agents (`node_agent/`)** — Each agent continuously collects system telemetry (CPU, memory, process count) and sends it to the controller over ZeroMQ.
2. **Layer 2: ZeroMQ Messaging** — Used for high-performance communication between nodes and the controller.
3. **Layer 3: Risk Engine (`controller/`)** — Assesses cumulative risk scores dynamically. Features context-aware threshold checks and risk decay (self-healing).
4. **Layer 4: Auto-Remediation (`controller/`)** — Monitors risk levels and initiates container-based node isolation/quarantine via the Docker API.
5. **Layer 5: Dashboard (`dashboard/`)** — A Flask-based web application showing real-time statistics, node states, and security events.

```
                ┌──────────────────────────┐
                │        CONTROLLER        │
                │  Security Monitor        │◄── ZMQ :5555 (telemetry)
                │  Risk Engine             │
                │  Heartbeat Checker       │
                │  Auto Remediator         │──► Docker API
                │  DB Writer               │──► SQLite
                └───────────┬──────────────┘
                     ZMQ :5555 │
                            ▼
                 ┌──────────────────┐
                 │   NODE AGENTS    │  ×4 (node1 to node4)
                 │  Telemetry       │
                 │  Anomaly Detect  │
                 └──────────────────┘

                ┌───────────────────────┐
                │      DASHBOARD        │
                │  Flask + SQLite       │
                │  localhost:5000       │
                └───────────────────────┘
```

---

## Key Features

* **Cumulative Risk Scoring & Self-Healing:** The controller maintains a cumulative risk score for each node. If anomalies cease, the risk score decays slowly back to 0.
* **Heartbeat Monitor:** Detects silent node failures. If a node fails to send telemetry for 30 seconds, it is marked as unresponsive.
* **Automated Quarantine:** Once a node's cumulative risk score hits or exceeds `100`, the controller automatically stops the compromised node's container via the Docker API.
* **Mock Wazuh Integration:** A simulated Wazuh SIEM manager receives and displays security alerts when risk thresholds are exceeded.

---

## Security Detection Rules

| Rule | Trigger Condition | Risk Increment |
| :--- | :--- | :--- |
| **High CPU** | CPU > 10% | `+20` risk points |
| **High Memory** | Memory > 50% | `+20` risk points |
| **Too Many Processes** | Process count > 300 | `+25` risk points |
| **Suspicious Process** | Binary name match (e.g. `nmap`, `hydra`, `nc`, `stress`) | `+40` risk points |

---

## Suspicious Activity Detection

Currently, a node is marked as suspicious if it exhibits one or more of the following:

* High CPU usage
* High memory usage
* Excessive number of running processes
* Suspicious process names (e.g., `stress`, `nmap`, `hydra`, `netcat`)

These detections are rule-based and serve as a proof-of-concept implementation.

---

## Project Structure

```text
Always-On-Security/
│
├── controller/
│   ├── controller.py
│   ├── wazuh_controller.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── dashboard/
│   ├── app.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── templates/
│       └── index.html
│
├── node_agent/
│   ├── agent.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── wazuh/
│   ├── wazuh.py
│   └── Dockerfile
│
├── data/
│
├── docker-compose.yml
└── .gitignore
```

---

## Prerequisites

Install the following:

### Ubuntu / Linux (Native)

```bash
sudo apt update
sudo apt install git docker.io docker-compose-plugin -y
```

### Windows with WSL (Docker Desktop)

Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) and enable WSL integration in:
`Settings → Resources → WSL Integration → Enable your distro`

### Verify Installation

```bash
docker --version
docker compose version
git --version
```

---

## Clone Repository

```bash
git clone <repository-url>
cd Always-On-Security
```

---

## Start the System

Build and start all services:

```bash
docker compose up --build
```

The following containers will start:

* `controller`
* `dashboard`
* `node1`, `node2`, `node3`, `node4`
* `wazuh`

---

## Access Dashboard

Open your browser and go to:

```text
http://localhost:5000
```

You should see:

* Event statistics
* Node risk scores
* Recent security events
* System activity feed

---

## Generate a Test Alert

Open a shell inside a node:

```bash
docker exec -it node1 bash
```

Generate high CPU usage:

```bash
yes > /dev/null
```

This should trigger:

* High CPU detection
* Risk score increase
* Event creation
* Dashboard updates
* Wazuh alert (when risk ≥ 50)
* Node quarantine (when risk ≥ 100)

Stop the process:

```bash
CTRL + C
```

---

## Useful Commands

```bash
docker compose logs -f              # Stream all logs
docker compose logs -f controller   # Stream controller logs only
docker ps                           # Show status of all containers
docker compose down                 # Stop and clean up the environment
```

---

## Capabilities Demonstrated

* Distributed container monitoring
* Real-time event collection via ZeroMQ
* Risk analysis and scoring
* Automated remediation via Docker API
* Dashboard visualization with Flask + SQLite
* Mock SIEM integration (Wazuh)
