# encoding: utf-8

"""
    config.py
    ~~~~~~

    Configuration elements.

    :copyright: 2013 Patrick Rabu <patrick@rabu.fr>.
    :license: GPL-3, see LICENSE for more details.
"""

import os
basedir = os.path.abspath(os.path.dirname(__file__))

CSRF_ENABLED = True
SECRET_KEY = 'development key'

# Configuration
DATABASE_URI = os.path.join(basedir, "releves.sqlite")

# Pattern for the datetime
DT_FMT = "%Y-%m-%d %H:%M:%S"

# Mail server settings
MAIL_SERVER = 'localhost'
MAIL_PORT = 25
MAIL_USE_SSL = False
MAIL_USE_TLS = False
MAIL_USERNAME = None
MAIL_PASSWORD = None

# administrator list
ADMINS = ['webmaster@rabu.fr']
