#!/usr/bin/env python
"""
TEMPORARY DIAGNOSTIC WRAPPER - DO NOT KEEP IN PRODUCTION.

Instruments Django's migration flow to identify the exact call where
startup freezes on Azure Container Apps. NO fixes are applied.

Usage: python -u diagnose_migrate.py
"""
import os
import time
import threading

# Match the container's settings module (Dockerfile ENV already sets this).
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')


def _ts():
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime()) + '.%03d' % (int(time.time() * 1000) % 1000)


def log(msg):
    print('[DIAG %s] %s' % (_ts(), msg), flush=True)


# ---------------------------------------------------------------------------
# Watchdog: if any stage blocks longer than 5 seconds, report the stage that
# was entered last.
# ---------------------------------------------------------------------------
_stage = {'name': 'script start', 'entered_at': time.time(), 'warned': False}


def _watchdog():
    while True:
        time.sleep(1)
        elapsed = time.time() - _stage['entered_at']
        if elapsed > 5 and not _stage['warned']:
            _stage['warned'] = True
            log('WATCHDOG: stage "%s" was entered last and has been BLOCKED for %.1fs (still running)' % (_stage['name'], elapsed))


threading.Thread(target=_watchdog, daemon=True).start()


def stage(name):
    _stage['name'] = name
    _stage['entered_at'] = time.time()
    _stage['warned'] = False
    log('>>> ENTERING: %s' % name)


def done(name):
    log('<<< COMPLETED: %s' % name)


# --- Phase 1: django.setup() ------------------------------------------------
stage('before django.setup()')
import django
django.setup()
done('after django.setup()')

# --- Phase 2: import MigrationExecutor --------------------------------------
stage('before importing MigrationExecutor')
from django.db.migrations.executor import MigrationExecutor
done('after importing MigrationExecutor')

# --- Phase 3: create database connection ------------------------------------
stage('before creating database connection')
from django.db import connections
connection = connections['default']
done('after creating database connection')

# --- Phase 4: open connection ------------------------------------------------
stage('before opening database connection (ensure_connection)')
connection.ensure_connection()
done('after opening database connection')

# --- Phase 5: MigrationExecutor(...) -----------------------------------------
stage('before MigrationExecutor(connection)')
executor = MigrationExecutor(connection)
done('after MigrationExecutor(connection)')

# --- Phase 6: migration plan --------------------------------------------------
stage('before migration plan')
targets = executor.loader.graph.leaf_nodes()
plan = executor.migration_plan(targets)
done('after migration plan')

# --- Phase 7: executor.migrate() ----------------------------------------------
stage('before executor.migrate(targets, plan)')
executor.migrate(targets, plan=plan)
done('after executor.migrate()')

log('ALL MIGRATION PHASES COMPLETED SUCCESSFULLY')