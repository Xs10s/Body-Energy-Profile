from __future__ import annotations

import json
import sys

from calc_core_py.core.engine import calculate_energy_profile
from calc_core_py.schemas.models import EnergyProfileInput


def main() -> int:
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    input_data = EnergyProfileInput.model_validate(payload)
    result = calculate_energy_profile(input_data)
    sys.stdout.write(result.model_dump_json())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
