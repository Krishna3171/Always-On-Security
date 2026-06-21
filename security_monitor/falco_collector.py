"""
security_monitor/falco_collector.py — Falco Event Integration (Improvement 5)

Tails Falco's JSON output log and normalises events into the internal
security event pipeline.

Falco runs in the Infrastructure Zone as a separate container.
It does NOT run inside workload containers.

Event mapping:
  priority=CRITICAL/ERROR → REVERSE_SHELL, CONTAINER_ESCAPE_ATTEMPT, PRIV_ESC_ATTEMPT
  priority=WARNING        → FALCO_ALERT
  priority=INFO/DEBUG     → FALCO_ALERT (lower severity)

The Falco output JSON format:
  {
    "output": "...",
    "priority": "Warning",
    "rule": "Terminal shell in container",
    "time": "2026-...",
    "output_fields": {
      "container.name": "node1",
      ...
    }
  }
"""

from __future__ import annotations

import json
import os
import time
import logging
import threading

log = logging.getLogger("falco_collector")

FALCO_LOG_PATH = os.getenv("FALCO_OUTPUT_FILE", "/var/log/falco/events.json")

# Rules that indicate a reverse shell or escalation attempt
REVERSE_SHELL_RULES = {
    "Reverse shell",
    "Reverse Shell",
    "reverse shell",
    "Outbound Connection to C2 Servers",
}
CONTAINER_ESCAPE_RULES = {
    "Container escape",
    "Write below root",
    "Mount Launched in Privileged Container",
    "Mkdir in Privileged Container",
    "Launch Privileged Container",
}
PRIV_ESC_RULES = {
    "Sudo or sudo-related activity",
    "su or sudo",
    "Change thread namespace",
    "Launch Sensitive Mount Container",
    "Set Setuid or Setgid bit",
}

FALCO_PRIORITY_TO_SEVERITY = {
    "EMERGENCY": "CRITICAL",
    "ALERT":     "CRITICAL",
    "CRITICAL":  "CRITICAL",
    "ERROR":     "HIGH",
    "WARNING":   "HIGH",
    "NOTICE":    "MEDIUM",
    "INFO":      "LOW",
    "DEBUG":     "LOW",
}


def _classify_rule(rule_name: str) -> str:
    """Map a Falco rule name to one of our threat types."""
    for name in REVERSE_SHELL_RULES:
        if name.lower() in rule_name.lower():
            return "REVERSE_SHELL"
    for name in CONTAINER_ESCAPE_RULES:
        if name.lower() in rule_name.lower():
            return "CONTAINER_ESCAPE_ATTEMPT"
    for name in PRIV_ESC_RULES:
        if name.lower() in rule_name.lower():
            return "PRIV_ESC_ATTEMPT"
    return "FALCO_ALERT"


def _tail_file(path: str):
    """Yield lines from a growing file, blocking until new content arrives."""
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        open(path, "a").close()
    with open(path, "r") as f:
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.3)
                continue
            yield line


def _parse_falco_event(raw: str) -> dict | None:
    """Parse a single Falco JSON log line into a normalised security event."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None

    rule       = data.get("rule", "")
    priority   = data.get("priority", "WARNING").upper()
    output     = data.get("output", "")
    fields     = data.get("output_fields", {})
    ts         = data.get("time", "")

    # Attempt to extract container/node name from Falco output fields
    container_name = (
        fields.get("container.name")
        or fields.get("k8s.pod.name")
        or "unknown"
    )
    # Normalise: strip leading slash if Falco includes it
    container_name = container_name.lstrip("/")

    severity    = FALCO_PRIORITY_TO_SEVERITY.get(priority, "MEDIUM")
    threat_type = _classify_rule(rule)

    # Escalate severity for high-confidence threats
    if threat_type in ("REVERSE_SHELL", "CONTAINER_ESCAPE_ATTEMPT", "PRIV_ESC_ATTEMPT"):
        severity = "CRITICAL"

    return {
        "source":      "falco",
        "timestamp":   ts,
        "threat_type": threat_type,
        "severity":    severity,
        "description": output or rule,
        "node_id":     container_name,
        "evidence": {
            "rule":          rule,
            "priority":      priority,
            "output":        output,
            "output_fields": fields,
        },
    }


def run_falco_collector(event_queue):
    log.info(f"Falco collector thread started — tailing {FALCO_LOG_PATH}")
    for line in _tail_file(FALCO_LOG_PATH):
        line = line.strip()
        if not line:
            continue
        evt = _parse_falco_event(line)
        if evt:
            log.info(
                f"Falco event: rule='{evt['evidence']['rule']}' "
                f"node={evt['node_id']} severity={evt['severity']}"
            )
            event_queue.put(evt)
