#!venv/bin/python
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
app.run(host='192.168.0.100', port=5000, debug=True)
