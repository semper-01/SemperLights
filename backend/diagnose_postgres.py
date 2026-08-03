#!/usr/bin/env python
"""TEMPORARY DIAGNOSTIC - DO NOT KEEP IN PRODUCTION.

Standalone PostgreSQL connectivity test using psycopg directly.
Does NOT start Django, does NOT import models, does NOT call migrate.
Objective: determine whether the block occurs before TCP accept, during SSL, or during auth.
Usage: python -u diagnose_postgres.py
"""
import os, socket, ssl, sys, time, traceback
from urllib.parse import urlparse, parse_qs

FAILURES = []

def ts():
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime()) + '.%03d' % (int(time.time() * 1000) % 1000)

def log(m):
    print('[DIAG %s] %s' % (ts(), m), flush=True)

def enter(name):
    log('>>> ENTERING: %s' % name)

def done(name):
    log('<<< COMPLETED: %s' % name)

def mask(url):
    p = urlparse(url)
    if not p.password:
        return url
    host = p.hostname or ''
    if p.port:
        host += ':%d' % p.port
    return '%s://%s:%s@%s%s%s' % (p.scheme, p.username or '', '****', host, p.path or '/', ('?' + p.query) if p.query else '')

# --- Phase 1: DATABASE_URL ---------------------------------------------------
enter('parsing DATABASE_URL')
url = os.getenv('DATABASE_URL')
if not url:
    log('DATABASE_URL is NOT set')
    sys.exit(1)
log('DATABASE_URL (masked): %s' % mask(url))
p = urlparse(url)
host, port, dbname = p.hostname, p.port or 5432, (p.path or '/').lstrip('/')
opts = parse_qs(p.query) if p.query else {}
sslmode = (opts.get('sslmode') or ['prefer'])[0]
log('target: host=%s port=%s dbname=%s sslmode=%s' % (host, port, dbname, sslmode))
done('parsing DATABASE_URL')

# --- Phase 2: DNS resolution -------------------------------------------------
enter('DNS resolution (socket.getaddrinfo)')
try:
    t0 = time.time()
    infos = socket.getaddrinfo(host, port, socket.AF_UNSPEC, socket.SOCK_STREAM)
    dns_t = time.time() - t0
    log('DNS time: %.3f s' % dns_t)
    addrs = sorted({i[4][0] for i in infos})
    for a in addrs:
        log('  resolved IP: %s' % a)
    done('DNS resolution')
except Exception:
    traceback.print_exc(); FAILURES.append('DNS failed'); sys.exit(1)

# --- Phase 3: Raw TCP connect (10s timeout) ----------------------------------
enter('raw TCP connect to %s:%s (10s timeout)' % (host, port))
sock = None
try:
    t0 = time.time()
    sock = socket.create_connection((host, port), timeout=10)
    tcp_t = time.time() - t0
    log('TCP connect time: %.3f s' % tcp_t)
    log('TCP ok: local %s -> remote %s' % (sock.getsockname(), sock.getpeername()))
    done('raw TCP connect')
except Exception:
    traceback.print_exc(); FAILURES.append('TCP failed')
    if sock: sock.close()
    sys.exit(1)

# --- Phase 4: SSL handshake (if not disable) ---------------------------------
ssl_t = None
if sslmode != 'disable':
    enter('SSL handshake (%s)' % sslmode)
    try:
        ctx = ssl.create_default_context()
        t0 = time.time()
        ss = ctx.wrap_socket(sock, server_hostname=host)
        ssl_t = time.time() - t0
        log('SSL time: %.3f s' % ssl_t)
        log('TLS: %s, cipher: %s' % (ss.version(), ss.cipher()))
        ss.close()
        done('SSL handshake')
    except Exception:
        traceback.print_exc(); FAILURES.append('SSL failed')
        try: sock.close()
        except Exception: pass
else:
    log('sslmode=disable -> skipping SSL phase')
    try: sock.close()
    except Exception: pass

# --- Phase 5: psycopg.connect() with connect_timeout=10 ----------------------
enter('psycopg.connect(connect_timeout=10)')
try:
    import psycopg
    t0 = time.time()
    conn = psycopg.connect(conninfo=url, connect_timeout=10)
    total_t = time.time() - t0
    log('psycopg.connect() TOTAL: %.3f s' % total_t)
    if ssl_t is not None:
        log('  breakdown: DNS %.3f | TCP %.3f | SSL %.3f | auth+overhead %.3f' % (dns_t, tcp_t, ssl_t, total_t - tcp_t - ssl_t))
    else:
        log('  breakdown: DNS %.3f | TCP %.3f | auth+overhead %.3f' % (dns_t, tcp_t, total_t - tcp_t))
    log('SSL in use (libpq): %s' % conn.info.ssl_in_use)
    log('server version: %s' % conn.info.server_version)
    done('psycopg.connect()')
except Exception:
    traceback.print_exc(); FAILURES.append('psycopg.connect failed'); sys.exit(1)

# --- Phase 6: diagnostic queries ---------------------------------------------
enter('executing SELECT version(); current_database(); current_user;')
try:
    with conn.cursor() as cur:
        cur.execute('SELECT version();')
        log('version => %s' % (cur.fetchone()[0] if cur.description else None))
        cur.execute('SELECT current_database();')
        log('current_database => %s' % (cur.fetchone()[0] if cur.description else None))
        cur.execute('SELECT current_user;')
        log('current_user => %s' % (cur.fetchone()[0] if cur.description else None))
    done('diagnostic queries')
except Exception:
    traceback.print_exc(); FAILURES.append('queries failed'); sys.exit(1)
finally:
    try: conn.close()
    except Exception: pass

if FAILURES:
    log('RESULT: FAILURE (%s)' % ', '.join(FAILURES)); sys.exit(1)
log('RESULT: PostgreSQL connectivity SUCCESS')
log('Block is NOT at TCP/SSL/auth - it occurs later (migration graph/apps loading)')
sys.exit(0)