#!venv python
# encoding: utf-8

"""
    run.py
    ~~~~~~

    Starts the development server.

    :copyright: (c) 2013 by Patrick Rabu.
    :license: GPL-3, see LICENSE for more details.
"""

from flask import Flask

from app import app
app.run(host='127.0.0.1', port=5000, debug=True)
