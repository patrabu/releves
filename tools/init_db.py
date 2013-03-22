#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" 
    init_db.py 
    ~~~~~~~~~~
    
    Initialize a sqlite dababase.
    The name of the database (DATABASE) is given of the command line. 
    The script containing the DDL should be named DATABASE.sql.
    The database file created is DATABASE.sqlite. 
    
    :copyright: (c) 2013 by Patrick Rabu.
    :license: GPL-3, see LICENSE for more details.
"""

import sys
import sqlite3

# Get filename from command line
dbname = sys.argv[1]

dbfile = dbname + ".sqlite"
scriptfile = dbname + ".sql"

print "Script {} to create database {} in file {}".format(scriptfile, dbname, dbfile)

conn = sqlite3.connect(dbfile)
with conn:
    with open(scriptfile, 'r') as f:
        conn.cursor().executescript(f.read())
conn.close()
