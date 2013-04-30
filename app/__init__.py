# encoding: utf-8

"""
    __init__.py
    ~~~~~~~~~~~

    Init file for the app package.

    :copyright: (c) 2013 by Patrick Rabu.
    :license: GPL-3, see LICENSE for more details.
"""

from flask import Flask

app = Flask(__name__)
app.config.from_object('config')
app.config.from_envvar('RELEVES_SETTINGS', silent=True)

from app import routes

