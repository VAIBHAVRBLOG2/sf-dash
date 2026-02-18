"""
Tests for all SF-Dash API endpoints.
Run with:  pytest test_api.py -v
"""

import httpx
import pytest

BASE_URL = "http://localhost:8000"


# ──────────────────────────────────────────────
# 1. Health Check
# ──────────────────────────────────────────────

def test_health_check():
    r = httpx.get(f"{BASE_URL}/kg/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


# ──────────────────────────────────────────────
# 2. Get All Store Procedures
# ──────────────────────────────────────────────

def test_get_all_store_procedures():
    r = httpx.get(f"{BASE_URL}/kg/api/store-procedures")
    assert r.status_code == 200
    data = r.json()
    assert "total" in data
    assert "procedures" in data
    assert data["total"] == 5
    assert len(data["procedures"]) == 5


def test_get_store_procedures_filter_domain():
    r = httpx.get(f"{BASE_URL}/kg/api/store-procedures", params={"domain": "finance"})
    assert r.status_code == 200
    data = r.json()
    assert data["filters"]["domain"] == "finance"
    for proc in data["procedures"]:
        assert proc["domain"] == "finance"


def test_get_store_procedures_filter_package():
    r = httpx.get(
        f"{BASE_URL}/kg/api/store-procedures",
        params={"package": "PKG_CUSTOMER_CORE"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["filters"]["package"] == "PKG_CUSTOMER_CORE"
    for proc in data["procedures"]:
        assert proc["package_name"] == "PKG_CUSTOMER_CORE"


def test_get_store_procedures_filter_both():
    r = httpx.get(
        f"{BASE_URL}/kg/api/store-procedures",
        params={"domain": "finance", "package": "PKG_FINANCE_CORE"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 3
    for proc in data["procedures"]:
        assert proc["domain"] == "finance"
        assert proc["package_name"] == "PKG_FINANCE_CORE"


# ──────────────────────────────────────────────
# 3. Get Procedure Graph
# ──────────────────────────────────────────────

def test_get_procedure_graph():
    r = httpx.get(
        f"{BASE_URL}/kg/api/store-procedures/P_FETCH_ACCOUNT_SUMMARY/graph"
    )
    assert r.status_code == 200
    data = r.json()
    assert data["procedure"]["procedure_name"] == "P_FETCH_ACCOUNT_SUMMARY"
    assert len(data["parameters"]) == 2
    assert len(data["tables"]) >= 1
    assert len(data["queries"]) >= 1
    assert "called_procedures" in data
    assert "packages" in data
    assert "functions" in data
    assert "exception_handlers" in data


def test_get_procedure_graph_with_package():
    r = httpx.get(
        f"{BASE_URL}/kg/api/store-procedures/P_FETCH_ACCOUNT_SUMMARY/graph",
        params={"package": "PKG_FINANCE_CORE"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["procedure"]["package_name"] == "PKG_FINANCE_CORE"


# ──────────────────────────────────────────────
# 4. Get Procedure Overview
# ──────────────────────────────────────────────

def test_get_procedure_overview():
    r = httpx.get(
        f"{BASE_URL}/kg/api/store-procedures/P_FETCH_ACCOUNT_SUMMARY/overview"
    )
    assert r.status_code == 200
    data = r.json()
    assert data["procedure_name"] == "P_FETCH_ACCOUNT_SUMMARY"
    assert "procedure_overview" in data
    assert len(data["procedure_overview"]) > 0


# ──────────────────────────────────────────────
# 5. Get All Packages
# ──────────────────────────────────────────────

def test_get_all_packages():
    r = httpx.get(f"{BASE_URL}/kg/api/packages")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 4
    assert len(data["packages"]) == 4
    pkg_names = [p["package_name"] for p in data["packages"]]
    assert "PKG_FINANCE_CORE" in pkg_names
    assert "PKG_CUSTOMER_CORE" in pkg_names


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
