import os
basedir = os.path.abspath(os.path.dirname(__file__))

CSRF_ENABLED = True
SECRET_KEY = 'development key'

# Configuration
DATABASE_URI = os.path.join(basedir, "releves.sqlite")

# Pattern for the datetime
DT_FMT = "%Y-%m-%d %H:%M:%S"
