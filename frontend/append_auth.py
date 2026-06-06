import os

auth_css_path = r"c:\Users\prade\OneDrive\Desktop\CODING\WEB DEVELOPMENT\nodejs\nocus\frontend\assets\css\auth.css"

additional_css = """

/* 
================================================================================
GLOBAL COMPONENTS & TABLES (Added to unify the project)
================================================================================
*/

/* ── Badges & Tags ── */
.badge {
    display: inline-block;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: bold;
    border-radius: 3px;
    font-family: monospace;
    text-transform: uppercase;
}

.badge-easy {
    background: #d4edda;
    color: #155724;
}

.badge-medium {
    background: #fff3cd;
    color: #856404;
}

.badge-hard {
    background: #f8d7da;
    color: #721c24;
}

.tag {
    display: inline-flex;
    align-items: center;
    background: #e9ecef;
    border: 1px solid #ced4da;
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 11px;
    margin-right: 4px;
    color: #495057;
}

.tag button {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    margin-left: 4px;
    font-size: 14px;
    line-height: 1;
}

.tag button:hover {
    color: #dc3545;
}

/* ── Tables ── */
.table-wrap {
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

table {
    width: 100%;
    border-collapse: collapse;
}

thead {
    background-color: #f3f7fa;
}

th {
    text-align: left;
    padding: 10px 15px;
    font-size: 13px;
    font-weight: bold;
    color: #3b5998;
    border-bottom: 1px solid #ccc;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
}

th:hover {
    background-color: #e2e6ea;
}

th.sort-asc::after {
    content: ' ▲';
    font-size: 10px;
}

th.sort-desc::after {
    content: ' ▼';
    font-size: 10px;
}

td {
    padding: 10px 15px;
    border-bottom: 1px solid #eee;
    font-size: 13px;
    color: #333;
    vertical-align: middle;
}

tr:last-child td {
    border-bottom: none;
}

tr:hover td {
    background-color: #fafbfc;
}

/* ── Acceptance Rate Bar ── */
.rate-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.rate-bar {
    width: 60px;
    height: 6px;
    background: #e9ecef;
    border-radius: 3px;
    overflow: hidden;
}

.rate-fill {
    height: 100%;
    background: #3b5998;
    border-radius: 3px;
}

.rate-text {
    font-size: 12px;
    color: #555;
    white-space: nowrap;
    font-family: monospace;
}

/* ── Empty Row ── */
.empty-row td {
    text-align: center;
    padding: 30px;
    color: #6c757d;
    font-style: italic;
}

/* ── Pagination ── */
.pagination {
    background: #fafbfc;
    border-top: 1px solid #ccc;
    padding: 10px 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.pagination span {
    font-size: 12px;
    color: #666;
    font-weight: bold;
}

.page-btns {
    display: flex;
    gap: 5px;
}

.page-btn {
    border: 1px solid #aaa;
    border-radius: 2px;
    background: #fff;
    color: #333;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
    font-weight: bold;
}

.page-btn:hover {
    background: #eee;
}

.page-btn.active {
    background: #3b5998;
    color: #fff;
    border-color: #3b5998;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ── Filters Bar ── */
.filters {
    background: #fafbfc;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 12px 15px;
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.filters input,
.filters select {
    border: 1px solid #aaa;
    border-radius: 3px;
    padding: 6px 10px;
    font-size: 13px;
    font-family: monospace;
    outline: none;
}

.filters input:focus,
.filters select:focus {
    border-color: #000;
}

.filters label {
    font-size: 12px;
    color: #444;
    font-weight: bold;
    text-transform: uppercase;
}

/* ── Action Buttons ── */
.actions {
    display: flex;
    gap: 6px;
}

.btn-action {
    padding: 4px 10px;
    font-size: 11px;
    border: 1px solid #aaa;
    border-radius: 2px;
    background: #fff;
    cursor: pointer;
    text-decoration: none;
    color: #333;
    display: inline-block;
    font-weight: bold;
    text-transform: uppercase;
}

.btn-action:hover {
    background: #eee;
}

.btn-delete {
    color: #b91c1c;
    border-color: #fca5a5;
}

.btn-delete:hover {
    background: #fef2f2;
}

/* ── Status ── */
.status-active {
    color: #28a745;
    font-weight: bold;
}

.status-inactive {
    color: #6c757d;
}

/* ── Top Bar ── */
.topbar {
    background: #fff;
    border-bottom: 1px solid #ccc;
    padding: 0 15px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.topbar-brand {
    font-size: 16px;
    font-weight: bold;
    color: #111;
    text-decoration: none;
}

.topbar a {
    color: #3b5998;
    text-decoration: none;
    font-size: 13px;
    margin-left: 20px;
    font-weight: bold;
}

.topbar a:hover {
    text-decoration: underline;
}

/* ── Stats Bar ── */
.stats-bar {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.stat-box {
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 15px 20px;
    flex: 1;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-box .num {
    font-size: 24px;
    font-weight: 900;
    color: #111;
}

.stat-box .lbl {
    font-size: 11px;
    color: #666;
    margin-top: 4px;
    text-transform: uppercase;
    font-weight: bold;
}

.stat-easy .num { color: #155724; }
.stat-medium .num { color: #856404; }
.stat-hard .num { color: #721c24; }
"""

with open(auth_css_path, "a", encoding="utf-8") as f:
    f.write(additional_css)

print("Appended successfully.")
