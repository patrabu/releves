#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" 
    exec_sql.py
    ~~~~~~~~~~~
    
    Execute a sql statement against a sqlite dababase.
    
    :copyright: (c) 2013 by Patrick Rabu.
    :license: GPL-3, see LICENSE for more details.
"""

import sys
import sqlite3

# Get filename from command line
dbname = sys.argv[1]
sqlcommand = sys.argv[2]

dbfile = dbname + ".sqlite"

conn = sqlite3.connect(dbfile)
with conn:
    for row in conn.execute(sqlcommand).fetchall():
        print row
