from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI(title="SF-Dash API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Dummy Data
# ──────────────────────────────────────────────

PROCEDURES = [
    {
        "id": 101,
        "procedure_name": "P_FETCH_ACCOUNT_SUMMARY",
        "package_name": "PKG_FINANCE_CORE",
        "version": "v1.0",
        "domain": "finance",
        "created_at": "2026-01-10 09:00:00",
        "updated_at": "2026-01-12 12:00:00",
        "table_count": 3,
        "called_procedures_count": 2,
    },
    {
        "id": 102,
        "procedure_name": "P_CALC_INTEREST",
        "package_name": "PKG_FINANCE_CORE",
        "version": "v1.0",
        "domain": "finance",
        "created_at": "2026-01-11 10:00:00",
        "updated_at": "2026-01-13 14:00:00",
        "table_count": 2,
        "called_procedures_count": 1,
    },
    {
        "id": 103,
        "procedure_name": "P_GET_CUSTOMER_DETAILS",
        "package_name": "PKG_CUSTOMER_CORE",
        "version": "v2.0",
        "domain": "customer",
        "created_at": "2026-01-12 11:00:00",
        "updated_at": "2026-01-14 15:00:00",
        "table_count": 4,
        "called_procedures_count": 3,
    },
    {
        "id": 104,
        "procedure_name": "P_UPDATE_CUSTOMER_STATUS",
        "package_name": "PKG_CUSTOMER_CORE",
        "version": "v1.1",
        "domain": "customer",
        "created_at": "2026-01-13 08:00:00",
        "updated_at": "2026-01-15 09:00:00",
        "table_count": 1,
        "called_procedures_count": 0,
    },
    {
        "id": 105,
        "procedure_name": "P_GENERATE_REPORT",
        "package_name": "PKG_REPORTING",
        "version": "v1.0",
        "domain": "reporting",
        "created_at": "2026-01-14 07:00:00",
        "updated_at": "2026-01-16 10:00:00",
        "table_count": 5,
        "called_procedures_count": 2,
    },
    {
        "id": 106,
        "procedure_name": "P_PROCESS_PAYMENT",
        "package_name": "PKG_FINANCE_CORE",
        "version": "v2.1",
        "domain": "finance",
        "created_at": "2026-01-15 06:30:00",
        "updated_at": "2026-01-17 11:00:00",
        "table_count": 3,
        "called_procedures_count": 3,
    },
]

# ── Graph data for each procedure ──

PROCEDURE_GRAPHS = {
    "P_FETCH_ACCOUNT_SUMMARY": {
        "procedure": {
            "id": 101,
            "procedure_name": "P_FETCH_ACCOUNT_SUMMARY",
            "package_name": "PKG_FINANCE_CORE",
            "version": "v1.0",
            "domain": "finance",
            "created_at": "2026-01-10 09:00:00",
            "updated_at": "2026-01-12 12:00:00",
        },
        "parameters": [
            {"parameter_name": "PI_ACCOUNT_ID", "parameter_type": "NUMBER", "direction": "IN"},
            {"parameter_name": "PO_STATUS", "parameter_type": "VARCHAR2", "direction": "OUT"},
        ],
        "tables": [
            {
                "table_name": "ACCOUNT_MASTER",
                "schema_name": "FIN_SCHEMA",
                "operations": "SELECT",
                "columns": ["ACCOUNT_ID", "ACCOUNT_NAME", "ACCOUNT_TYPE"],
            },
            {
                "table_name": "ACCOUNT_BALANCE",
                "schema_name": "FIN_SCHEMA",
                "operations": "SELECT",
                "columns": ["ACCOUNT_ID", "BALANCE", "LAST_UPDATED"],
            },
            {
                "table_name": "ACCOUNT_STATUS",
                "schema_name": "FIN_SCHEMA",
                "operations": "SELECT",
                "columns": ["ACCOUNT_ID", "STATUS_CODE", "STATUS_DESC"],
            },
        ],
        "queries": [
            {
                "query_type": "SELECT",
                "raw_query": "SELECT ACCOUNT_ID, ACCOUNT_NAME, ACCOUNT_TYPE FROM ACCOUNT_MASTER WHERE ACCOUNT_ID = PI_ACCOUNT_ID;",
                "conditions": ["ACCOUNT_ID = PI_ACCOUNT_ID"],
                "inline_views": [],
                "tables": ["ACCOUNT_MASTER"],
            },
            {
                "query_type": "SELECT",
                "raw_query": "SELECT BALANCE, LAST_UPDATED FROM ACCOUNT_BALANCE WHERE ACCOUNT_ID = PI_ACCOUNT_ID;",
                "conditions": ["ACCOUNT_ID = PI_ACCOUNT_ID"],
                "inline_views": [],
                "tables": ["ACCOUNT_BALANCE"],
            },
        ],
        "called_procedures": ["PKG_UTILS.P_LOG_ACTIVITY", "PKG_UTILS.P_VALIDATE_ACCOUNT"],
        "packages": [
            {"package_name": "PKG_FINANCE_CORE", "relation_type": "BELONGS_TO"},
            {"package_name": "PKG_UTILS", "relation_type": "USES"},
        ],
        "functions": ["TO_CHAR", "NVL"],
        "exception_handlers": ["NO_DATA_FOUND", "OTHERS"],
    },

    "P_CALC_INTEREST": {
        "procedure": {
            "id": 102,
            "procedure_name": "P_CALC_INTEREST",
            "package_name": "PKG_FINANCE_CORE",
            "version": "v1.0",
            "domain": "finance",
            "created_at": "2026-01-11 10:00:00",
            "updated_at": "2026-01-13 14:00:00",
        },
        "parameters": [
            {"parameter_name": "PI_ACCOUNT_ID", "parameter_type": "NUMBER", "direction": "IN"},
            {"parameter_name": "PI_RATE", "parameter_type": "NUMBER", "direction": "IN"},
            {"parameter_name": "PO_INTEREST", "parameter_type": "NUMBER", "direction": "OUT"},
        ],
        "tables": [
            {
                "table_name": "ACCOUNT_BALANCE",
                "schema_name": "FIN_SCHEMA",
                "operations": "SELECT",
                "columns": ["ACCOUNT_ID", "BALANCE", "CURRENCY"],
            },
            {
                "table_name": "INTEREST_LOG",
                "schema_name": "FIN_SCHEMA",
                "operations": "INSERT",
                "columns": ["LOG_ID", "ACCOUNT_ID", "AMOUNT", "CALC_DATE"],
            },
        ],
        "queries": [
            {
                "query_type": "SELECT",
                "raw_query": "SELECT BALANCE, CURRENCY FROM ACCOUNT_BALANCE WHERE ACCOUNT_ID = PI_ACCOUNT_ID;",
                "conditions": ["ACCOUNT_ID = PI_ACCOUNT_ID"],
                "inline_views": [],
                "tables": ["ACCOUNT_BALANCE"],
            },
            {
                "query_type": "INSERT",
                "raw_query": "INSERT INTO INTEREST_LOG (LOG_ID, ACCOUNT_ID, AMOUNT, CALC_DATE) VALUES (SEQ_LOG.NEXTVAL, PI_ACCOUNT_ID, V_INTEREST, SYSDATE);",
                "conditions": [],
                "inline_views": [],
                "tables": ["INTEREST_LOG"],
            },
        ],
        "called_procedures": ["PKG_UTILS.P_LOG_ACTIVITY"],
        "packages": [
            {"package_name": "PKG_FINANCE_CORE", "relation_type": "BELONGS_TO"},
            {"package_name": "PKG_UTILS", "relation_type": "USES"},
        ],
        "functions": ["ROUND", "SYSDATE"],
        "exception_handlers": ["NO_DATA_FOUND", "ZERO_DIVIDE", "OTHERS"],
    },

    "P_GET_CUSTOMER_DETAILS": {
        "procedure": {
            "id": 103,
            "procedure_name": "P_GET_CUSTOMER_DETAILS",
            "package_name": "PKG_CUSTOMER_CORE",
            "version": "v2.0",
            "domain": "customer",
            "created_at": "2026-01-12 11:00:00",
            "updated_at": "2026-01-14 15:00:00",
        },
        "parameters": [
            {"parameter_name": "PI_CUSTOMER_ID", "parameter_type": "NUMBER", "direction": "IN"},
            {"parameter_name": "PO_CUST_NAME", "parameter_type": "VARCHAR2", "direction": "OUT"},
            {"parameter_name": "PO_CUST_EMAIL", "parameter_type": "VARCHAR2", "direction": "OUT"},
            {"parameter_name": "PO_STATUS", "parameter_type": "VARCHAR2", "direction": "OUT"},
        ],
        "tables": [
            {
                "table_name": "CUSTOMER_MASTER",
                "schema_name": "CUST_SCHEMA",
                "operations": "SELECT",
                "columns": ["CUSTOMER_ID", "FIRST_NAME", "LAST_NAME", "EMAIL", "PHONE"],
            },
            {
                "table_name": "CUSTOMER_ADDRESS",
                "schema_name": "CUST_SCHEMA",
                "operations": "SELECT",
                "columns": ["CUSTOMER_ID", "ADDRESS_LINE1", "CITY", "STATE", "ZIP_CODE"],
            },
            {
                "table_name": "CUSTOMER_PREFERENCES",
                "schema_name": "CUST_SCHEMA",
                "operations": "SELECT",
                "columns": ["CUSTOMER_ID", "PREF_KEY", "PREF_VALUE"],
            },
            {
                "table_name": "AUDIT_TRAIL",
                "schema_name": "CUST_SCHEMA",
                "operations": "INSERT",
                "columns": ["AUDIT_ID", "ACTION", "ENTITY_ID", "TIMESTAMP"],
            },
        ],
        "queries": [
            {
                "query_type": "SELECT",
                "raw_query": "SELECT FIRST_NAME || ' ' || LAST_NAME, EMAIL FROM CUSTOMER_MASTER WHERE CUSTOMER_ID = PI_CUSTOMER_ID;",
                "conditions": ["CUSTOMER_ID = PI_CUSTOMER_ID"],
                "inline_views": [],
                "tables": ["CUSTOMER_MASTER"],
            },
            {
                "query_type": "SELECT",
                "raw_query": "SELECT ADDRESS_LINE1, CITY, STATE, ZIP_CODE FROM CUSTOMER_ADDRESS WHERE CUSTOMER_ID = PI_CUSTOMER_ID AND ROWNUM = 1;",
                "conditions": ["CUSTOMER_ID = PI_CUSTOMER_ID", "ROWNUM = 1"],
                "inline_views": [],
                "tables": ["CUSTOMER_ADDRESS"],
            },
            {
                "query_type": "INSERT",
                "raw_query": "INSERT INTO AUDIT_TRAIL (AUDIT_ID, ACTION, ENTITY_ID, TIMESTAMP) VALUES (SEQ_AUDIT.NEXTVAL, 'VIEW_CUSTOMER', PI_CUSTOMER_ID, SYSDATE);",
                "conditions": [],
                "inline_views": [],
                "tables": ["AUDIT_TRAIL"],
            },
        ],
        "called_procedures": ["PKG_UTILS.P_LOG_ACTIVITY", "PKG_UTILS.P_VALIDATE_SESSION", "PKG_NOTIFICATION.P_CHECK_ALERTS"],
        "packages": [
            {"package_name": "PKG_CUSTOMER_CORE", "relation_type": "BELONGS_TO"},
            {"package_name": "PKG_UTILS", "relation_type": "USES"},
            {"package_name": "PKG_NOTIFICATION", "relation_type": "USES"},
        ],
        "functions": ["TO_CHAR", "NVL", "UPPER"],
        "exception_handlers": ["NO_DATA_FOUND", "TOO_MANY_ROWS", "OTHERS"],
    },

    "P_UPDATE_CUSTOMER_STATUS": {
        "procedure": {
            "id": 104,
            "procedure_name": "P_UPDATE_CUSTOMER_STATUS",
            "package_name": "PKG_CUSTOMER_CORE",
            "version": "v1.1",
            "domain": "customer",
            "created_at": "2026-01-13 08:00:00",
            "updated_at": "2026-01-15 09:00:00",
        },
        "parameters": [
            {"parameter_name": "PI_CUSTOMER_ID", "parameter_type": "NUMBER", "direction": "IN"},
            {"parameter_name": "PI_NEW_STATUS", "parameter_type": "VARCHAR2", "direction": "IN"},
            {"parameter_name": "PO_RESULT", "parameter_type": "VARCHAR2", "direction": "OUT"},
        ],
        "tables": [
            {
                "table_name": "CUSTOMER_MASTER",
                "schema_name": "CUST_SCHEMA",
                "operations": "UPDATE",
                "columns": ["CUSTOMER_ID", "STATUS", "UPDATED_AT"],
            },
        ],
        "queries": [
            {
                "query_type": "UPDATE",
                "raw_query": "UPDATE CUSTOMER_MASTER SET STATUS = PI_NEW_STATUS, UPDATED_AT = SYSDATE WHERE CUSTOMER_ID = PI_CUSTOMER_ID;",
                "conditions": ["CUSTOMER_ID = PI_CUSTOMER_ID"],
                "inline_views": [],
                "tables": ["CUSTOMER_MASTER"],
            },
        ],
        "called_procedures": [],
        "packages": [
            {"package_name": "PKG_CUSTOMER_CORE", "relation_type": "BELONGS_TO"},
        ],
        "functions": ["SYSDATE"],
        "exception_handlers": ["NO_DATA_FOUND", "OTHERS"],
    },

    "P_GENERATE_REPORT": {
        "procedure": {
            "id": 105,
            "procedure_name": "P_GENERATE_REPORT",
            "package_name": "PKG_REPORTING",
            "version": "v1.0",
            "domain": "reporting",
            "created_at": "2026-01-14 07:00:00",
            "updated_at": "2026-01-16 10:00:00",
        },
        "parameters": [
            {"parameter_name": "PI_REPORT_TYPE", "parameter_type": "VARCHAR2", "direction": "IN"},
            {"parameter_name": "PI_START_DATE", "parameter_type": "DATE", "direction": "IN"},
            {"parameter_name": "PI_END_DATE", "parameter_type": "DATE", "direction": "IN"},
            {"parameter_name": "PO_REPORT_ID", "parameter_type": "NUMBER", "direction": "OUT"},
            {"parameter_name": "PO_STATUS", "parameter_type": "VARCHAR2", "direction": "OUT"},
        ],
        "tables": [
            {
                "table_name": "REPORT_METADATA",
                "schema_name": "RPT_SCHEMA",
                "operations": "INSERT",
                "columns": ["REPORT_ID", "REPORT_TYPE", "CREATED_BY", "CREATED_AT", "STATUS"],
            },
            {
                "table_name": "ACCOUNT_MASTER",
                "schema_name": "FIN_SCHEMA",
                "operations": "SELECT",
                "columns": ["ACCOUNT_ID", "ACCOUNT_NAME", "ACCOUNT_TYPE"],
            },
            {
                "table_name": "TRANSACTION_HISTORY",
                "schema_name": "FIN_SCHEMA",
                "operations": "SELECT",
                "columns": ["TXN_ID", "ACCOUNT_ID", "AMOUNT", "TXN_DATE", "TXN_TYPE"],
            },
            {
                "table_name": "REPORT_LINES",
                "schema_name": "RPT_SCHEMA",
                "operations": "INSERT",
                "columns": ["LINE_ID", "REPORT_ID", "LINE_DATA", "SEQ_NO"],
            },
            {
                "table_name": "REPORT_SCHEDULE",
                "schema_name": "RPT_SCHEMA",
                "operations": "SELECT",
                "columns": ["SCHEDULE_ID", "REPORT_TYPE", "FREQUENCY", "NEXT_RUN"],
            },
        ],
        "queries": [
            {
                "query_type": "SELECT",
                "raw_query": "SELECT TXN_ID, ACCOUNT_ID, AMOUNT, TXN_DATE FROM TRANSACTION_HISTORY WHERE TXN_DATE BETWEEN PI_START_DATE AND PI_END_DATE ORDER BY TXN_DATE;",
                "conditions": ["TXN_DATE BETWEEN PI_START_DATE AND PI_END_DATE"],
                "inline_views": [],
                "tables": ["TRANSACTION_HISTORY"],
            },
            {
                "query_type": "INSERT",
                "raw_query": "INSERT INTO REPORT_METADATA (REPORT_ID, REPORT_TYPE, CREATED_BY, CREATED_AT, STATUS) VALUES (SEQ_RPT.NEXTVAL, PI_REPORT_TYPE, USER, SYSDATE, 'PENDING');",
                "conditions": [],
                "inline_views": [],
                "tables": ["REPORT_METADATA"],
            },
            {
                "query_type": "SELECT",
                "raw_query": "SELECT a.ACCOUNT_NAME, SUM(t.AMOUNT) AS TOTAL FROM ACCOUNT_MASTER a JOIN TRANSACTION_HISTORY t ON a.ACCOUNT_ID = t.ACCOUNT_ID GROUP BY a.ACCOUNT_NAME;",
                "conditions": [],
                "inline_views": [],
                "tables": ["ACCOUNT_MASTER", "TRANSACTION_HISTORY"],
            },
        ],
        "called_procedures": ["PKG_UTILS.P_LOG_ACTIVITY", "PKG_NOTIFICATION.P_SEND_EMAIL"],
        "packages": [
            {"package_name": "PKG_REPORTING", "relation_type": "BELONGS_TO"},
            {"package_name": "PKG_UTILS", "relation_type": "USES"},
            {"package_name": "PKG_NOTIFICATION", "relation_type": "USES"},
        ],
        "functions": ["TO_CHAR", "SYSDATE", "NVL", "SUM"],
        "exception_handlers": ["NO_DATA_FOUND", "INVALID_NUMBER", "OTHERS"],
    },

    "P_PROCESS_PAYMENT": {
        "procedure": {
            "id": 106,
            "procedure_name": "P_PROCESS_PAYMENT",
            "package_name": "PKG_FINANCE_CORE",
            "version": "v2.1",
            "domain": "finance",
            "created_at": "2026-01-15 06:30:00",
            "updated_at": "2026-01-17 11:00:00",
        },
        "parameters": [
            {"parameter_name": "PI_PAYER_ACCOUNT", "parameter_type": "NUMBER", "direction": "IN"},
            {"parameter_name": "PI_PAYEE_ACCOUNT", "parameter_type": "NUMBER", "direction": "IN"},
            {"parameter_name": "PI_AMOUNT", "parameter_type": "NUMBER", "direction": "IN"},
            {"parameter_name": "PI_CURRENCY", "parameter_type": "VARCHAR2", "direction": "IN"},
            {"parameter_name": "PO_TXN_ID", "parameter_type": "NUMBER", "direction": "OUT"},
            {"parameter_name": "PO_STATUS", "parameter_type": "VARCHAR2", "direction": "OUT"},
        ],
        "tables": [
            {
                "table_name": "ACCOUNT_BALANCE",
                "schema_name": "FIN_SCHEMA",
                "operations": "SELECT, UPDATE",
                "columns": ["ACCOUNT_ID", "BALANCE", "CURRENCY", "LAST_UPDATED"],
            },
            {
                "table_name": "TRANSACTION_HISTORY",
                "schema_name": "FIN_SCHEMA",
                "operations": "INSERT",
                "columns": ["TXN_ID", "PAYER_ID", "PAYEE_ID", "AMOUNT", "CURRENCY", "TXN_DATE", "STATUS"],
            },
            {
                "table_name": "PAYMENT_RULES",
                "schema_name": "FIN_SCHEMA",
                "operations": "SELECT",
                "columns": ["RULE_ID", "CURRENCY", "MAX_AMOUNT", "DAILY_LIMIT"],
            },
        ],
        "queries": [
            {
                "query_type": "SELECT",
                "raw_query": "SELECT BALANCE, CURRENCY FROM ACCOUNT_BALANCE WHERE ACCOUNT_ID = PI_PAYER_ACCOUNT FOR UPDATE;",
                "conditions": ["ACCOUNT_ID = PI_PAYER_ACCOUNT"],
                "inline_views": [],
                "tables": ["ACCOUNT_BALANCE"],
            },
            {
                "query_type": "UPDATE",
                "raw_query": "UPDATE ACCOUNT_BALANCE SET BALANCE = BALANCE - PI_AMOUNT, LAST_UPDATED = SYSDATE WHERE ACCOUNT_ID = PI_PAYER_ACCOUNT;",
                "conditions": ["ACCOUNT_ID = PI_PAYER_ACCOUNT"],
                "inline_views": [],
                "tables": ["ACCOUNT_BALANCE"],
            },
            {
                "query_type": "UPDATE",
                "raw_query": "UPDATE ACCOUNT_BALANCE SET BALANCE = BALANCE + PI_AMOUNT, LAST_UPDATED = SYSDATE WHERE ACCOUNT_ID = PI_PAYEE_ACCOUNT;",
                "conditions": ["ACCOUNT_ID = PI_PAYEE_ACCOUNT"],
                "inline_views": [],
                "tables": ["ACCOUNT_BALANCE"],
            },
            {
                "query_type": "INSERT",
                "raw_query": "INSERT INTO TRANSACTION_HISTORY (TXN_ID, PAYER_ID, PAYEE_ID, AMOUNT, CURRENCY, TXN_DATE, STATUS) VALUES (SEQ_TXN.NEXTVAL, PI_PAYER_ACCOUNT, PI_PAYEE_ACCOUNT, PI_AMOUNT, PI_CURRENCY, SYSDATE, 'COMPLETED');",
                "conditions": [],
                "inline_views": [],
                "tables": ["TRANSACTION_HISTORY"],
            },
            {
                "query_type": "SELECT",
                "raw_query": "SELECT MAX_AMOUNT, DAILY_LIMIT FROM PAYMENT_RULES WHERE CURRENCY = PI_CURRENCY;",
                "conditions": ["CURRENCY = PI_CURRENCY"],
                "inline_views": [],
                "tables": ["PAYMENT_RULES"],
            },
        ],
        "called_procedures": ["PKG_UTILS.P_LOG_ACTIVITY", "PKG_UTILS.P_VALIDATE_ACCOUNT", "PKG_NOTIFICATION.P_SEND_RECEIPT"],
        "packages": [
            {"package_name": "PKG_FINANCE_CORE", "relation_type": "BELONGS_TO"},
            {"package_name": "PKG_UTILS", "relation_type": "USES"},
            {"package_name": "PKG_NOTIFICATION", "relation_type": "USES"},
        ],
        "functions": ["SYSDATE", "NVL", "TO_NUMBER"],
        "exception_handlers": ["NO_DATA_FOUND", "INSUFFICIENT_FUNDS", "OTHERS"],
    },
}

# ── Overview (markdown) data for each procedure ──

PROCEDURE_OVERVIEWS = {
    "P_FETCH_ACCOUNT_SUMMARY": {
        "procedure_id": "1",
        "procedure_name": "P_FETCH_ACCOUNT_SUMMARY",
        "procedure_overview": (
            "# P_FETCH_ACCOUNT_SUMMARY\n\n"
            "## Table of Contents\n"
            "1. Overview\n"
            "2. Domain & Package\n"
            "3. Tables Used\n"
            "4. Queries\n"
            "5. External Packages\n\n"
            "## Overview\n"
            "This stored procedure fetches the account summary for a given account ID. "
            "It retrieves key account details from the ACCOUNT_MASTER table, pulls the current balance "
            "from ACCOUNT_BALANCE, and checks status via ACCOUNT_STATUS. Activity is logged through PKG_UTILS.\n\n"
            "## Domain & Package\n"
            "- **Domain:** finance\n"
            "- **Package:** PKG_FINANCE_CORE\n"
            "- **Version:** v1.0\n\n"
            "## Tables Used\n"
            "- `ACCOUNT_MASTER` (FIN_SCHEMA) — SELECT on ACCOUNT_ID, ACCOUNT_NAME, ACCOUNT_TYPE\n"
            "- `ACCOUNT_BALANCE` (FIN_SCHEMA) — SELECT on ACCOUNT_ID, BALANCE, LAST_UPDATED\n"
            "- `ACCOUNT_STATUS` (FIN_SCHEMA) — SELECT on ACCOUNT_ID, STATUS_CODE, STATUS_DESC\n\n"
            "## Queries\n"
            "```sql\nSELECT ACCOUNT_ID, ACCOUNT_NAME, ACCOUNT_TYPE FROM ACCOUNT_MASTER WHERE ACCOUNT_ID = PI_ACCOUNT_ID;\n```\n"
            "```sql\nSELECT BALANCE, LAST_UPDATED FROM ACCOUNT_BALANCE WHERE ACCOUNT_ID = PI_ACCOUNT_ID;\n```\n\n"
            "## External Packages Used\n"
            "- `PKG_UTILS.P_LOG_ACTIVITY` — Logs access events\n"
            "- `PKG_UTILS.P_VALIDATE_ACCOUNT` — Validates account existence\n"
        ),
    },

    "P_CALC_INTEREST": {
        "procedure_id": "2",
        "procedure_name": "P_CALC_INTEREST",
        "procedure_overview": (
            "# P_CALC_INTEREST\n\n"
            "## Table of Contents\n"
            "1. Overview\n"
            "2. Domain & Package\n"
            "3. Tables Used\n"
            "4. Queries\n"
            "5. External Packages\n\n"
            "## Overview\n"
            "Calculates the interest for a given account based on the current balance and a supplied rate. "
            "The computed interest is written to the INTEREST_LOG table for audit purposes. "
            "Handles edge cases such as zero-balance accounts and division errors.\n\n"
            "## Domain & Package\n"
            "- **Domain:** finance\n"
            "- **Package:** PKG_FINANCE_CORE\n"
            "- **Version:** v1.0\n\n"
            "## Tables Used\n"
            "- `ACCOUNT_BALANCE` (FIN_SCHEMA) — SELECT to read current balance\n"
            "- `INTEREST_LOG` (FIN_SCHEMA) — INSERT to record calculated interest\n\n"
            "## Queries\n"
            "```sql\nSELECT BALANCE, CURRENCY FROM ACCOUNT_BALANCE WHERE ACCOUNT_ID = PI_ACCOUNT_ID;\n```\n"
            "```sql\nINSERT INTO INTEREST_LOG (LOG_ID, ACCOUNT_ID, AMOUNT, CALC_DATE) VALUES (SEQ_LOG.NEXTVAL, PI_ACCOUNT_ID, V_INTEREST, SYSDATE);\n```\n\n"
            "## External Packages Used\n"
            "- `PKG_UTILS.P_LOG_ACTIVITY` — Logs calculation events\n"
        ),
    },

    "P_GET_CUSTOMER_DETAILS": {
        "procedure_id": "3",
        "procedure_name": "P_GET_CUSTOMER_DETAILS",
        "procedure_overview": (
            "# P_GET_CUSTOMER_DETAILS\n\n"
            "## Table of Contents\n"
            "1. Overview\n"
            "2. Domain & Package\n"
            "3. Tables Used\n"
            "4. Queries\n"
            "5. External Packages\n\n"
            "## Overview\n"
            "Retrieves comprehensive customer information including personal details, primary address, "
            "and preferences. An audit record is created for every access. The procedure supports "
            "session validation and checks for pending notification alerts.\n\n"
            "## Domain & Package\n"
            "- **Domain:** customer\n"
            "- **Package:** PKG_CUSTOMER_CORE\n"
            "- **Version:** v2.0\n\n"
            "## Tables Used\n"
            "- `CUSTOMER_MASTER` (CUST_SCHEMA) — SELECT on personal details\n"
            "- `CUSTOMER_ADDRESS` (CUST_SCHEMA) — SELECT on primary address\n"
            "- `CUSTOMER_PREFERENCES` (CUST_SCHEMA) — SELECT on preferences\n"
            "- `AUDIT_TRAIL` (CUST_SCHEMA) — INSERT for audit logging\n\n"
            "## Queries\n"
            "```sql\nSELECT FIRST_NAME || ' ' || LAST_NAME, EMAIL FROM CUSTOMER_MASTER WHERE CUSTOMER_ID = PI_CUSTOMER_ID;\n```\n"
            "```sql\nSELECT ADDRESS_LINE1, CITY, STATE, ZIP_CODE FROM CUSTOMER_ADDRESS WHERE CUSTOMER_ID = PI_CUSTOMER_ID AND ROWNUM = 1;\n```\n\n"
            "## External Packages Used\n"
            "- `PKG_UTILS.P_LOG_ACTIVITY` — Activity logging\n"
            "- `PKG_UTILS.P_VALIDATE_SESSION` — Session validation\n"
            "- `PKG_NOTIFICATION.P_CHECK_ALERTS` — Pending alert check\n"
        ),
    },

    "P_UPDATE_CUSTOMER_STATUS": {
        "procedure_id": "4",
        "procedure_name": "P_UPDATE_CUSTOMER_STATUS",
        "procedure_overview": (
            "# P_UPDATE_CUSTOMER_STATUS\n\n"
            "## Table of Contents\n"
            "1. Overview\n"
            "2. Domain & Package\n"
            "3. Tables Used\n"
            "4. Queries\n"
            "5. External Packages\n\n"
            "## Overview\n"
            "A lightweight procedure that updates the status field on the CUSTOMER_MASTER table. "
            "Accepts a customer ID and the new status value. Returns the result of the operation. "
            "No external procedure dependencies — fully self-contained.\n\n"
            "## Domain & Package\n"
            "- **Domain:** customer\n"
            "- **Package:** PKG_CUSTOMER_CORE\n"
            "- **Version:** v1.1\n\n"
            "## Tables Used\n"
            "- `CUSTOMER_MASTER` (CUST_SCHEMA) — UPDATE on STATUS and UPDATED_AT\n\n"
            "## Queries\n"
            "```sql\nUPDATE CUSTOMER_MASTER SET STATUS = PI_NEW_STATUS, UPDATED_AT = SYSDATE WHERE CUSTOMER_ID = PI_CUSTOMER_ID;\n```\n\n"
            "## External Packages Used\n"
            "- None\n"
        ),
    },

    "P_GENERATE_REPORT": {
        "procedure_id": "5",
        "procedure_name": "P_GENERATE_REPORT",
        "procedure_overview": (
            "# P_GENERATE_REPORT\n\n"
            "## Table of Contents\n"
            "1. Overview\n"
            "2. Domain & Package\n"
            "3. Tables Used\n"
            "4. Queries\n"
            "5. External Packages\n\n"
            "## Overview\n"
            "Generates financial reports by aggregating transaction data across accounts within a date range. "
            "Creates a report metadata record, populates line items, and optionally sends an email notification "
            "upon completion. Supports multiple report types including daily summary, monthly reconciliation, "
            "and quarterly audit reports.\n\n"
            "## Domain & Package\n"
            "- **Domain:** reporting\n"
            "- **Package:** PKG_REPORTING\n"
            "- **Version:** v1.0\n\n"
            "## Tables Used\n"
            "- `REPORT_METADATA` (RPT_SCHEMA) — INSERT to create report header\n"
            "- `ACCOUNT_MASTER` (FIN_SCHEMA) — SELECT for account names\n"
            "- `TRANSACTION_HISTORY` (FIN_SCHEMA) — SELECT for transaction data\n"
            "- `REPORT_LINES` (RPT_SCHEMA) — INSERT for report line items\n"
            "- `REPORT_SCHEDULE` (RPT_SCHEMA) — SELECT for scheduling info\n\n"
            "## Queries\n"
            "```sql\nSELECT TXN_ID, ACCOUNT_ID, AMOUNT, TXN_DATE FROM TRANSACTION_HISTORY\nWHERE TXN_DATE BETWEEN PI_START_DATE AND PI_END_DATE ORDER BY TXN_DATE;\n```\n"
            "```sql\nSELECT a.ACCOUNT_NAME, SUM(t.AMOUNT) AS TOTAL\nFROM ACCOUNT_MASTER a JOIN TRANSACTION_HISTORY t ON a.ACCOUNT_ID = t.ACCOUNT_ID\nGROUP BY a.ACCOUNT_NAME;\n```\n\n"
            "## External Packages Used\n"
            "- `PKG_UTILS.P_LOG_ACTIVITY` — Logs report generation events\n"
            "- `PKG_NOTIFICATION.P_SEND_EMAIL` — Sends completion notification\n"
        ),
    },

    "P_PROCESS_PAYMENT": {
        "procedure_id": "6",
        "procedure_name": "P_PROCESS_PAYMENT",
        "procedure_overview": (
            "# P_PROCESS_PAYMENT\n\n"
            "## Table of Contents\n"
            "1. Overview\n"
            "2. Domain & Package\n"
            "3. Tables Used\n"
            "4. Queries\n"
            "5. External Packages\n\n"
            "## Overview\n"
            "Processes a payment transfer between two accounts. The procedure validates the payer's balance "
            "against payment rules (max amount, daily limit), debits the payer account, credits the payee "
            "account, and records the transaction. Uses `SELECT ... FOR UPDATE` to prevent concurrent "
            "modification. Sends a receipt notification upon success.\n\n"
            "## Domain & Package\n"
            "- **Domain:** finance\n"
            "- **Package:** PKG_FINANCE_CORE\n"
            "- **Version:** v2.1\n\n"
            "## Tables Used\n"
            "- `ACCOUNT_BALANCE` (FIN_SCHEMA) — SELECT + UPDATE for balance operations\n"
            "- `TRANSACTION_HISTORY` (FIN_SCHEMA) — INSERT to record transaction\n"
            "- `PAYMENT_RULES` (FIN_SCHEMA) — SELECT to validate limits\n\n"
            "## Queries\n"
            "```sql\nSELECT BALANCE, CURRENCY FROM ACCOUNT_BALANCE WHERE ACCOUNT_ID = PI_PAYER_ACCOUNT FOR UPDATE;\n```\n"
            "```sql\nUPDATE ACCOUNT_BALANCE SET BALANCE = BALANCE - PI_AMOUNT WHERE ACCOUNT_ID = PI_PAYER_ACCOUNT;\n```\n"
            "```sql\nUPDATE ACCOUNT_BALANCE SET BALANCE = BALANCE + PI_AMOUNT WHERE ACCOUNT_ID = PI_PAYEE_ACCOUNT;\n```\n\n"
            "## External Packages Used\n"
            "- `PKG_UTILS.P_LOG_ACTIVITY` — Activity logging\n"
            "- `PKG_UTILS.P_VALIDATE_ACCOUNT` — Account validation\n"
            "- `PKG_NOTIFICATION.P_SEND_RECEIPT` — Payment receipt\n"
        ),
    },
}

PACKAGES = [
    {
        "id": 10,
        "package_name": "PKG_FINANCE_CORE",
        "created_at": "2026-01-10 09:00:00",
        "procedure_count": 3,
        "domains": "finance",
    },
    {
        "id": 11,
        "package_name": "PKG_CUSTOMER_CORE",
        "created_at": "2026-01-11 10:30:00",
        "procedure_count": 2,
        "domains": "customer",
    },
    {
        "id": 12,
        "package_name": "PKG_UTILS",
        "created_at": "2026-01-08 08:00:00",
        "procedure_count": 5,
        "domains": "shared",
    },
    {
        "id": 13,
        "package_name": "PKG_REPORTING",
        "created_at": "2026-01-09 07:30:00",
        "procedure_count": 1,
        "domains": "reporting",
    },
    {
        "id": 14,
        "package_name": "PKG_NOTIFICATION",
        "created_at": "2026-01-09 09:00:00",
        "procedure_count": 3,
        "domains": "shared",
    },
]


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────


@app.get("/kg/api/health")
def health_check():
    return {"status": "healthy", "database": "connected"}


@app.get("/kg/api/store-procedures")
def get_all_store_procedures(
    domain: Optional[str] = Query(None),
    package: Optional[str] = Query(None),
):
    filtered = PROCEDURES
    if domain:
        filtered = [p for p in filtered if p["domain"] == domain]
    if package:
        filtered = [p for p in filtered if p["package_name"] == package]

    return {
        "total": len(filtered),
        "filters": {
            "domain": domain,
            "package": package,
        },
        "procedures": filtered,
    }


@app.get("/kg/api/store-procedures/{procedure_name}/graph")
def get_procedure_graph(
    procedure_name: str,
    package: Optional[str] = Query(None),
):
    graph = PROCEDURE_GRAPHS.get(procedure_name)
    if graph is None:
        return {"detail": f"Procedure '{procedure_name}' not found"}, 404
    if package and graph["procedure"]["package_name"] != package:
        return {"detail": f"Procedure '{procedure_name}' not found in package '{package}'"}, 404
    return graph


@app.get("/kg/api/store-procedures/{procedure_name}/overview")
def get_procedure_overview(procedure_name: str):
    overview = PROCEDURE_OVERVIEWS.get(procedure_name)
    if overview is None:
        return {"detail": f"Procedure '{procedure_name}' not found"}, 404
    return overview


@app.get("/kg/api/packages")
def get_all_packages():
    return {
        "total": len(PACKAGES),
        "packages": PACKAGES,
    }


# ──────────────────────────────────────────────
# Run
# ──────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
