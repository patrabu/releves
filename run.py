#!venv/bin/python

# encoding: utf-8

"""
    run.py
    ~~~~~~

    Starts the development server.

    :copyright: 2013 Patrick Rabu <patrick@rabu.fr>.
    :license: GPL-3, see LICENSE for more details.
"""

from app import app
app.run(host='127.0.0.1', port=5000, debug=True)
