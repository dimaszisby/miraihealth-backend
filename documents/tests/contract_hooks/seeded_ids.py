"""
Schemathesis hook that injects deterministic IDs sourced from tmp/contract-seed.json.

The hook ensures Hypothesis-generated cases always reference seeded metrics,
metric settings, and metric logs so stateful endpoints hit real resources
instead of random UUIDs that would 404.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import math
import re
import schemathesis
from schemathesis import GenerationMode
from schemathesis.core.control import SkipTest
try:  # Python 3.9+ stdlib
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover - fallback for older runtimes
    ZoneInfo = None

SEED_FILE = Path(
    os.getenv("SCHEMATHESIS_SEED_FILE", "")
).expanduser()  # Defaults to repo/tmp/contract-seed.json


def _load_seed() -> Dict[str, Any]:
    if not SEED_FILE or not SEED_FILE.exists():
        return {}
    try:
        return json.loads(SEED_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


SEED_DATA = _load_seed()
METRICS = SEED_DATA.get("metrics") or {}
CATEGORIES = SEED_DATA.get("categories") or {}
PRIMARY_USER = SEED_DATA.get("primaryUser") or {}
PRIMARY_USER_EMAIL = PRIMARY_USER.get("email")
PRIMARY_USER_PASSWORD = PRIMARY_USER.get("password")


def _pick_metric(keys: tuple[str, ...]) -> Optional[Dict[str, Any]]:
    for key in keys:
        if key in METRICS:
            return METRICS[key]
    for entry in METRICS.values():
        return entry
    return None


def _pick_category(keys: tuple[str, ...]) -> Optional[Dict[str, Any]]:
    for key in keys:
        if key in CATEGORIES:
            return CATEGORIES[key]
    for entry in CATEGORIES.values():
        return entry
    return None


PRIMARY_METRIC = _pick_metric(("revenue", "productivity"))
PRIMARY_METRIC_ID = (PRIMARY_METRIC or {}).get("id")
PRIMARY_SETTINGS_ID = (PRIMARY_METRIC or {}).get("settingsId")
PRIMARY_LOG_ID = (PRIMARY_METRIC or {}).get("latestLogId")
PRIMARY_CATEGORY = _pick_category(("revenue", "productivity"))
PRIMARY_CATEGORY_ID = (PRIMARY_CATEGORY or {}).get("id")
LAST_CREATED_METRIC_ID: Optional[str] = None
MAX_BUCKETS = int(os.getenv("VIZ_MAX_BUCKETS", "400"))
LAST_WINDOW_RE = re.compile(r"^([1-9][0-9]*)([hdwmy])$")
LAST_UNIT_SECONDS = {
    "h": 60 * 60,
    "d": 24 * 60 * 60,
    "w": 7 * 24 * 60 * 60,
    "m": 30 * 24 * 60 * 60,
    "y": 365 * 24 * 60 * 60,
}
BUCKET_SECONDS = {
    "1h": 60 * 60,
    "1d": 24 * 60 * 60,
    "1w": 7 * 24 * 60 * 60,
    "1m": 30 * 24 * 60 * 60,
    "1y": 365 * 24 * 60 * 60,
}
BUCKET_UNIT = {
    "1h": "h",
    "1d": "d",
    "1w": "w",
    "1m": "m",
    "1y": "y",
}


def _ensure_mapping(mapping: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if mapping is None:
        return {}
    if isinstance(mapping, dict):
        return dict(mapping)
    try:
        return dict(mapping)
    except Exception:
        return {}


def _update(mapping: Optional[Dict[str, Any]], values: Dict[str, Any]) -> Dict[str, Any]:
    target = _ensure_mapping(mapping)
    for key, value in values.items():
        if value is not None:
            target[key] = value
    return target


def _is_path(case, target: str) -> bool:
    path = getattr(case, "path", None)
    if path is None and hasattr(case, "operation"):
        path = getattr(case.operation, "path", None)
    if path is None and hasattr(case, "endpoint"):
        path = getattr(case.endpoint, "path", None)
    return path == target


def _unique_suffix() -> str:
    return uuid.uuid4().hex[:8]


def _parse_iso(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value
    if not isinstance(value, str):
        return None
    try:
        normalized = value.strip()
        if normalized.endswith("Z"):
            normalized = normalized[:-1] + "+00:00"
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def _to_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _normalize_range(query: Dict[str, Any]) -> None:
    start_raw = query.get("start")
    end_raw = query.get("end")

    if start_raw is None and end_raw is None:
        return

    start_dt = _parse_iso(start_raw)
    end_dt = _parse_iso(end_raw)

    if start_dt is None or end_dt is None:
        query.pop("start", None)
        query.pop("end", None)
        return

    if end_dt <= start_dt:
        end_dt = start_dt + timedelta(hours=1)

    bucket = _coerce_bucket(query.get("bucket"))
    bucket_seconds = BUCKET_SECONDS.get(bucket, BUCKET_SECONDS["1d"])
    span_seconds = (end_dt - start_dt).total_seconds()
    est = math.ceil(span_seconds / bucket_seconds) + 2
    if est > MAX_BUCKETS:
        end_dt = start_dt + timedelta(
            seconds=bucket_seconds * max(MAX_BUCKETS - 2, 1)
        )

    query["start"] = _to_iso(start_dt)
    query["end"] = _to_iso(end_dt)


def _coerce_bucket(value: Any) -> str:
    if isinstance(value, (list, tuple)) and value:
        value = value[0]
    if isinstance(value, str) and value in BUCKET_SECONDS:
        return value
    return "1d"


def _safe_last(bucket: Any) -> str:
    unit = BUCKET_UNIT.get(_coerce_bucket(bucket), "d")
    amount = min(30, MAX_BUCKETS)
    return f"{amount}{unit}"


def _normalize_last(query: Dict[str, Any], *, allow_with_range: bool = True) -> None:
    if not allow_with_range and (query.get("start") is not None or query.get("end") is not None):
        query.pop("last", None)
        return
    last_raw = query.get("last")
    bucket = _coerce_bucket(query.get("bucket"))
    if not isinstance(last_raw, str) or not last_raw:
        query["last"] = _safe_last(bucket)
        return
    match = LAST_WINDOW_RE.match(last_raw.strip())
    if match is None:
        query["last"] = _safe_last(bucket)
        return
    amount = int(match.group(1))
    unit = match.group(2)
    if amount <= 0:
        query["last"] = _safe_last(bucket)
        return
    bucket_seconds = BUCKET_SECONDS.get(bucket, BUCKET_SECONDS["1d"])
    window_seconds = amount * LAST_UNIT_SECONDS[unit]
    est = math.ceil(window_seconds / bucket_seconds) + 2
    if est > MAX_BUCKETS:
        query["last"] = _safe_last(bucket)


def _is_valid_tz(value: Any) -> bool:
    if not isinstance(value, str) or not value:
        return False
    if value.upper() == "UTC":
        return True
    if ZoneInfo is None:
        return value in {"Asia/Jakarta", "America/New_York", "Europe/London"}
    try:
        ZoneInfo(value)
        return True
    except Exception:
        return False


def _force_valid_tz(query: Dict[str, Any]) -> None:
    tz = query.get("tz")
    if tz is None:
        return
    if not isinstance(tz, str) or not _is_valid_tz(tz):
        query["tz"] = "UTC"


def _sanitize_filter(query: Dict[str, Any]) -> None:
    if "filter" in query and not isinstance(query["filter"], dict):
        query.pop("filter", None)
    if isinstance(query.get("filter"), dict) and not query["filter"]:
        query.pop("filter", None)


def _set_case_body(case, body: Dict[str, Any]) -> None:
    operation_body = getattr(case, "operation", None)
    if operation_body is None or not hasattr(operation_body, "body"):
        return
    alternatives = list(operation_body.body)
    if not alternatives:
        return
    case.body = body
    media_type = getattr(case, "media_type", None)
    if not media_type or all(alt.media_type != media_type for alt in alternatives):
        case.media_type = alternatives[0].media_type


def _is_positive_case(case) -> bool:
    meta = getattr(case, "meta", None)
    generation = getattr(meta, "generation", None)
    mode = getattr(generation, "mode", None)
    if mode is None:
        return True
    return mode == GenerationMode.POSITIVE


@schemathesis.hook("before_call")
def inject_seeded_ids(context, case, kwargs) -> None:  # kwargs unused but required by hook spec
    is_positive = _is_positive_case(case)
    method = getattr(case, "method", "GET").upper()

    if not is_positive:
        if _is_path(case, "/auth/register"):
            raise SkipTest("Skip negative register cases (false positives).")
        return

    query = _ensure_mapping(case.query)
    if "" in query:
        query.pop("", None)
        case.query = query
    if isinstance(query, dict):
        _sanitize_filter(query)
        case.query = query

    if method == "POST" and _is_path(case, "/auth/login"):
        body = case.body if isinstance(case.body, dict) else {}
        if PRIMARY_USER_EMAIL:
            body["email"] = PRIMARY_USER_EMAIL
        if PRIMARY_USER_PASSWORD:
            body["password"] = PRIMARY_USER_PASSWORD
        _set_case_body(case, body)

    # Metrics CRUD
    if _is_path(case, "/metrics/{id}"):
        override_id = PRIMARY_METRIC_ID
        if method in ("PUT", "DELETE") and LAST_CREATED_METRIC_ID:
            override_id = LAST_CREATED_METRIC_ID
        case.path_parameters = _update(case.path_parameters, {"id": override_id})
        if method in ("PUT", "PATCH"):
            body = case.body if isinstance(case.body, dict) else {}
            if (
                "categoryId" in body
                and body.get("categoryId") not in (None, "")
                and PRIMARY_CATEGORY_ID is not None
            ):
                body["categoryId"] = PRIMARY_CATEGORY_ID
            if "originalMetricId" in body and body.get("originalMetricId") not in (
                None,
                "",
            ):
                body["originalMetricId"] = None
            if not body:
                body["name"] = f"metric-{_unique_suffix()}"
            _set_case_body(case, body)

    if _is_path(case, "/metrics/{metricId}/trends"):
        case.path_parameters = _update(
            case.path_parameters, {"metricId": PRIMARY_METRIC_ID}
        )

    # Analytics dashboard range normalization (no seed data required).
    if _is_path(case, "/analytics/dashboard"):
        query = _ensure_mapping(case.query)
        _normalize_range(query)
        _normalize_last(query, allow_with_range=False)
        _force_valid_tz(query)
        case.query = query

    # Analytics visualizations per metric
    if _is_path(case, "/analytics/metrics/{metricId}"):
        case.path_parameters = _update(
            case.path_parameters, {"metricId": PRIMARY_METRIC_ID}
        )
        query = _ensure_mapping(case.query)
        _normalize_range(query)
        _normalize_last(query, allow_with_range=False)
        _force_valid_tz(query)
        case.query = query

    # Metric Settings endpoints with {id} + query metricId
    if PRIMARY_SETTINGS_ID is not None and _is_path(case, "/metric-settings/{id}"):
        case.path_parameters = _update(case.path_parameters, {"id": PRIMARY_SETTINGS_ID})
        case.query = _update(case.query, {"metricId": PRIMARY_METRIC_ID})

    if (
        PRIMARY_SETTINGS_ID is not None
        and _is_path(case, "/metric-settings/{id}/achieve")
    ):
        case.path_parameters = _update(case.path_parameters, {"id": PRIMARY_SETTINGS_ID})
        case.query = _update(case.query, {"metricId": PRIMARY_METRIC_ID})

    if (
        PRIMARY_SETTINGS_ID is not None
        and _is_path(case, "/metric-settings/{id}/display")
    ):
        case.path_parameters = _update(case.path_parameters, {"id": PRIMARY_SETTINGS_ID})
        case.query = _update(case.query, {"metricId": PRIMARY_METRIC_ID})

    # Metric Settings cursor filters
    if _is_path(case, "/metric-settings"):
        case.query = _update(case.query, {"filter[metricId]": PRIMARY_METRIC_ID})

    # Metric Logs endpoints
    if PRIMARY_LOG_ID is not None and _is_path(case, "/metric-logs/{id}"):
        case.path_parameters = _update(case.path_parameters, {"id": PRIMARY_LOG_ID})
        case.query = _update(case.query, {"metricId": PRIMARY_METRIC_ID})

    if _is_path(case, "/metric-logs"):
        case.query = _update(case.query, {"filter[metricId]": PRIMARY_METRIC_ID})

    if _is_path(case, "/metric-logs/stats"):
        case.query = _update(case.query, {"metricId": PRIMARY_METRIC_ID})

    # Ensure POST bodies reference seeded metric IDs when applicable
    if method == "POST" and _is_path(case, "/metric-logs"):
        body = case.body if isinstance(case.body, dict) else {}
        if PRIMARY_METRIC_ID is not None:
            body.setdefault("metricId", PRIMARY_METRIC_ID)
        _set_case_body(case, body)

    if method == "POST" and _is_path(case, "/metric-settings"):
        body = case.body if isinstance(case.body, dict) else {}
        if PRIMARY_METRIC_ID is not None:
            body.setdefault("metricId", PRIMARY_METRIC_ID)
        if body.get("goalEnabled") is True:
            if body.get("goalType") in (None, ""):
                body["goalType"] = "cumulative"
            if body.get("goalValue") is None:
                body["goalValue"] = 1
        start_dt = _parse_iso(body.get("startDate"))
        deadline_dt = _parse_iso(body.get("deadlineDate"))
        time_frame_enabled = body.get("timeFrameEnabled") is True
        if (time_frame_enabled or "startDate" in body) and start_dt is None:
            start_dt = datetime.now(timezone.utc)
            body["startDate"] = _to_iso(start_dt)
        if (time_frame_enabled or "deadlineDate" in body) and deadline_dt is None:
            base_dt = start_dt or datetime.now(timezone.utc)
            deadline_dt = base_dt + timedelta(days=1)
            body["deadlineDate"] = _to_iso(deadline_dt)
        if start_dt and deadline_dt and deadline_dt <= start_dt:
            deadline_dt = start_dt + timedelta(days=1)
            body["deadlineDate"] = _to_iso(deadline_dt)
        _set_case_body(case, body)

    if method in ("PUT", "PATCH") and _is_path(case, "/metric-settings/{id}"):
        body = case.body if isinstance(case.body, dict) else {}
        if not body:
            body["alertEnabled"] = False
        if body.get("goalEnabled") is True:
            if body.get("goalType") in (None, ""):
                body["goalType"] = "cumulative"
            if body.get("goalValue") is None:
                body["goalValue"] = 1
        start_dt = _parse_iso(body.get("startDate"))
        deadline_dt = _parse_iso(body.get("deadlineDate"))
        time_frame_enabled = body.get("timeFrameEnabled") is True
        if (time_frame_enabled or "startDate" in body) and start_dt is None:
            start_dt = datetime.now(timezone.utc)
            body["startDate"] = _to_iso(start_dt)
        if (time_frame_enabled or "deadlineDate" in body) and deadline_dt is None:
            base_dt = start_dt or datetime.now(timezone.utc)
            deadline_dt = base_dt + timedelta(days=1)
            body["deadlineDate"] = _to_iso(deadline_dt)
        if start_dt and deadline_dt and deadline_dt <= start_dt:
            deadline_dt = start_dt + timedelta(days=1)
            body["deadlineDate"] = _to_iso(deadline_dt)
        _set_case_body(case, body)

    # Ensure creates use unique identifiers to avoid conflict 409s.
    if method == "POST" and _is_path(case, "/auth/register"):
        body = case.body if isinstance(case.body, dict) else {}
        suffix = _unique_suffix()
        body["username"] = f"schemathesis_{suffix}"
        body["email"] = f"schemathesis_{suffix}@example.com"
        password = body.get("password") or "newpassword123"
        body["password"] = password
        body["passwordConfirmation"] = password
        body.setdefault("isPublicProfile", True)
        _set_case_body(case, body)

    if method == "POST" and _is_path(case, "/metric-categories"):
        body = case.body if isinstance(case.body, dict) else {}
        suffix = _unique_suffix()
        body["name"] = f"category-{suffix}"
        _set_case_body(case, body)

    if method == "POST" and _is_path(case, "/metrics"):
        body = case.body if isinstance(case.body, dict) else {}
        suffix = _unique_suffix()
        body["name"] = f"metric-{suffix}"
        _set_case_body(case, body)


@schemathesis.hook("after_call")
def capture_created_metric(context, case, response) -> None:
    if getattr(case, "method", "GET").upper() != "POST":
        return
    if not _is_path(case, "/metrics"):
        return
    if response.status_code not in (200, 201):
        return
    try:
        payload = response.json()
    except Exception:
        return
    metric_id = payload.get("data", {}).get("id")
    if isinstance(metric_id, str) and metric_id:
        global LAST_CREATED_METRIC_ID
        LAST_CREATED_METRIC_ID = metric_id
