import os
import logging
import zmq
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("controller")

OFFSET_PATH = "/data/controller.offset"


def load_offset() -> int:
    try:
        with open(OFFSET_PATH) as f:
            return int(f.read().strip())
    except Exception:
        return 0


def save_offset(offset: int) -> None:
    tmp = OFFSET_PATH + ".tmp"
    with open(tmp, "w") as f:
        f.write(str(offset))
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, OFFSET_PATH)


def main():
    offset = load_offset()
    log.info(f"Controller starting at offset {offset}")

    ctx = zmq.Context()

    recv = ctx.socket(zmq.PULL)
    recv.bind("tcp://*:5555")

    fwd = ctx.socket(zmq.PUSH)
    fwd.connect("tcp://risk-engine:5556")

    log.info("Listening on 5555 → forwarding to risk-engine:5556")

    while True:
        try:
            msg = recv.recv_json()
            offset += 1
            save_offset(offset)
            msg["_offset"] = offset
            msg["_received_at"] = datetime.now(timezone.utc).isoformat()
            fwd.send_json(msg)
            log.info(f"Forwarded offset={offset} node={msg.get('node')} event={msg.get('event_type')}")
        except Exception as e:
            log.error(f"Forward error: {e}", exc_info=True)


if __name__ == "__main__":
    main()
