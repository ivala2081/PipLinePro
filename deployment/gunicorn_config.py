"""
Gunicorn configuration for PipLinePro production deployment
"""

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = 2  # Adjusted for a small server
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 100

# Logging
accesslog = "logs/gunicorn_access.log"
errorlog = "logs/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'piplinepro'

# Daemon mode
daemon = False  # Set to True if you want to run as daemon

# User/group (run as specific user for security)
# user = "pipline"
# group = "pipline"

# Server mechanics
preload_app = True
pidfile = "/tmp/piplinepro.pid"

# SSL (if needed)
# keyfile = "/path/to/ssl/key.pem"
# certfile = "/path/to/ssl/cert.pem"
