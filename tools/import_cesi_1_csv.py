#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" 
    import_cesi_1_csv.py
    ~~~~~~~~~~~~~~~~~~~~
    
    Convert csv file into insert statements for loading into the releves database.
    
    The CSV filename should be in the form NAME_YYYY-MM.csv.
    The CSV file should be in this format:

    Day;Morning/Evening;Sensor1;Sensor2;Sensor3;Booster start;Booster end
    1;m;-5,1;18,4;65,2;00:30;07:30
    ;s;-3,3;20,5;57,2;;

    or

    Day;Morning/Evening;Sensor1;Sensor2;Sensor3;Booster
    1;m;-5,1;18,4;65,2;
    ;s;-3,3;20,5;57,2;;Oui
    
    :copyright: (c) 2013 by Patrick Rabu.
    :license: GPL-3, see LICENSE for more details.    
"""

import sys
import time
import datetime
import locale
import csv

csvfile = sys.argv[1]

ym = csvfile.split('_')[1].split('.')[0] + "-"
print "Filename {} -> ym={}".format(csvfile, ym)

cesiFile = open("cesiLog.sql", "a")
elecFile = open("elecLog.sql", "a")

with open(csvfile, 'rb') as f:
    locale.setlocale(locale.LC_ALL, 'fra_fra')
    oneday = datetime.timedelta(days=1)
    midnight = datetime.time(23,59,59)
    morning = datetime.time(7,0,0)
    evening = datetime.time(19,0,0)
    
    app = 0
    dt_app_s = None # Datetime at the start of appoint
    dt_app_e = None # Datetime at the end of  appoint 
    
    reader = csv.reader(f, delimiter=';', quoting=csv.QUOTE_NONE)
    reader.next() # Skip the first row
    for row in reader:
        if row[1] == 'm':
            day = datetime.datetime.strptime(ym + row[0], "%Y-%m-%d")
            dt_morning = datetime.datetime.combine(day.date(), morning)
            dt_evening = datetime.datetime.combine(day.date(), evening)
            dt = dt_morning
            dt_next = dt_evening
        else: 
            dt = dt_evening
            dt_next = datetime.datetime.combine(dt.date() + datetime.timedelta(days=1), morning)

        if len(row) > 5 and row[5] == "Oui":
            if row[1] == 'm':
                dt_app_s = dt_morning
            else:
                dt_app_s = dt_evening
            dt_app_e = dt_next

        if len(row) > 6 and row[5] != "" and row[5] != "Oui":
            # Interval
            hm_app_s = datetime.datetime.strptime(row[5], "%H:%M")
            dt_app_s = datetime.datetime.combine(dt.date(), hm_app_s.time())

            if row[1] == 's' and dt_app_s < dt and dt_app_s < dt_morning:
                dt_app_s = dt_app_s + datetime.timedelta(days=1)
            # print "Debut intervale pour appoint row={} dt_start={} dt={}".format(row[5], dt_app_s, dt)

            hm_app_e = datetime.datetime.strptime(row[6], "%H:%M") 
            dt_app_e = datetime.datetime.combine(dt_app_s.date(), hm_app_e.time())

            if dt_app_e < dt_app_s:
                dt_app_e = dt_app_e + datetime.timedelta(days=1)
            # print "Fin intervale pour appoint row={} dt_end={} dt_start={} ".format(row[6], dt_app_e, dt_app_s)
            # print "Intervale pour appoint debut={} fin={} ".format(dt_app_s, dt_app_e)

        if dt_app_s != None and dt_app_s < dt:
            app = 1
            tsReleve = int(time.mktime(dt_app_s.timetuple()))
            cesiFile.write("-- {}\n".format(dt_app_s))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            # print "Insertion ligne date={} app={}".format(dt_app_s, app)
            dt_app_s = None

        if dt_app_s != None and dt_app_s == dt:
            app = 1
            dt_app_s = None

        if dt_app_e != None and dt_app_e < dt:
            app = 0
            tsReleve = int(time.mktime(dt_app_e.timetuple()))
            cesiFile.write("-- {}\n".format(dt_app_e))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            # print "Insertion ligne date={} app={}".format(dt_app_e, app)
            dt_app_e = None

        if dt_app_e != None and dt_app_e == dt:
            app = 0
            dt_app_e = None
            
        if row[2] != "":
            s1 = locale.atof(row[2])
            s2 = locale.atof(row[3])
            s3 = locale.atof(row[4])
            tsReleve = int(time.mktime(dt.timetuple()))

            # print "Insertion ligne date={} s1={} s2={} s3={} app={}".format(dt, s1, s2, s3, app)
            cesiFile.write("-- {}\n".format(dt))
            cesiFile.write("insert into cesiLog values ({}, {}, {}, {}, {});\n".format(tsReleve, s1, s2, s3, app))
            if dt_app_s != None and dt_app_s == dt:
                dt_app_s = None

            if dt_app_e != None and dt_app_e == dt:
                dt_app_e = None
                       
        if dt_app_s != None and dt_app_s > dt :
            app = 1
            
        if dt_app_s != None and dt_app_s < dt_next:
            tsReleve = int(time.mktime(dt_app_s.timetuple()))
            cesiFile.write("-- {}\n".format(dt_app_s))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            # print "Insertion ligne date={} app={}".format(dt_app_s, app)
            dt_app_s = None

        if dt_app_e != None and dt_app_e < dt_next:
            app = 0
            tsReleve = int(time.mktime(dt_app_e.timetuple()))
            cesiFile.write("-- {}\n".format(dt_app_e))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            # print "Insertion ligne date={} app={}".format(dt_app_e, app)
            dt_app_e = None

cesiFile.close()
elecFile.close()
