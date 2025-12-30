# Gunicorn configuration file for SunoApp (Docker version)

import multiprocessing
import os

# Server socket
bind = '0.0.0.0:5000'
backlog = 2048

# Worker processes
workers = min(multiprocessing.cpu_count() * 2 + 1, 4)  # Cap at 4 workers for container
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = '/app/logs/gunicorn_access.log' if os.path.exists('/app/logs') else '-'
errorlog = '/app/logs/gunicorn_error.log' if os.path.exists('/app/logs') else '-'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = 'sunoapp'

# Server mechanics
daemon = False
pidfile = None  # Not needed in container
user = None
group = None
tmp_upload_dir = None

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Preload app for faster worker spawn
preload_app = True
