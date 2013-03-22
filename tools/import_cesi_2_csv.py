#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" 
    import_cesi_2_csv.py
    ~~~~~~~~~~~~~~~~~~~~

    Convert csv file into insert statements for loading into the releves database.

    The CSV filename should be in the form NAME_YYYY-MM.csv.

    The CSV file should be in this format 

    Day;Morning hour;Sensor1;Sensor2;Sensor3;Evening hour;Sensor1;Sensor2;Sensor3;Booster start;Booster end
    3;;-4,1;14,5;46,3;;3,5;23,6;48,9;18:00;19:00
    4;;1,2;21,6;44,1;;2,6;18,1;37,7;19:45;21:45

    These files have no electrical data.
    
    :copyright: (c) 2013 by Patrick Rabu.
    :license: GPL-3, see LICENSE for more details.
"""

import sys
import time
import datetime
import locale
import csv

# Get filename from command line
fn = sys.argv[1]

ym = fn.split('_')[1].split('.')[0] + "-"
print "Filename {} -> ym={}".format(fn, ym)

cesiFile = open("cesiLog.sql", "a")
elecFile = open("elecLog.sql", "a")
        
with open(fn, 'rb') as f:
    locale.setlocale(locale.LC_ALL, 'fra_fra')
    oneday = datetime.timedelta(days=1)
    midnight = datetime.time(23,59,59)

    prev_app_dt_s = None
    prev_app_dt_e = None
    app = 0
    
    reader = csv.reader(f, delimiter=';', quoting=csv.QUOTE_NONE)
    reader.next()
   
    for row in reader:
        s1_m = None
        s2_m = None
        s3_m = None
        el_m = None
        s1_s = None
        s2_s = None
        s3_s = None
        el_s = None
        
        if len(row[1]) == 0:
            dt_m = datetime.datetime.strptime(ym + row[0] + " 07:00", "%Y-%m-%d %H:%M")
        elif len(row[1]) == 5:
            dt_m = datetime.datetime.strptime(ym + row[0] + " " + row[1], "%Y-%m-%d %H:%M")
        else:
            dt_m = datetime.datetime.strptime(ym + row[0] + " " + row[1], "%Y-%m-%d %H:%M:%S")
        if row[2] != "":
            s1_m = locale.atof(row[2])
        if row[3] != "":
            s2_m = locale.atof(row[3])
        if row[4] != "":
            s3_m = locale.atof(row[4])

        if len(row[5]) == 0:
            dt_s = datetime.datetime.strptime(ym + row[0] + " 19:00", "%Y-%m-%d %H:%M")
        elif len(row[5]) == 5:
            dt_s = datetime.datetime.strptime(ym + row[0] + " " + row[5], "%Y-%m-%d %H:%M")
        else:
            dt_s = datetime.datetime.strptime(ym + row[0] + " " + row[5], "%Y-%m-%d %H:%M:%S")
        if row[6] != "":
            s1_s = locale.atof(row[6])
        if row[7] != "":
            s2_s = locale.atof(row[7])
        if row[8] != "":
            s3_s = locale.atof(row[8])
        
        #print "Previous start={} stop={}".format(prev_app_dt_s, prev_app_dt_e)
        if prev_app_dt_s != None and prev_app_dt_s < dt_m:
            app = 1
            #print "Write appoint start before morning log"
            #print "{} app={}".format(prev_app_dt_s, app)
            tsReleve = int(time.mktime(prev_app_dt_s.timetuple()))
            cesiFile.write("-- {}\n".format(prev_app_dt_s))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            prev_app_dt_s = None
        
        if prev_app_dt_e != None and prev_app_dt_e < dt_m:
            app = 0
            #print "Write appoint stop before morning log"
            #print "{} app={}".format(prev_app_dt_e, app)
            tsReleve = int(time.mktime(prev_app_dt_e.timetuple()))
            cesiFile.write("-- {}\n".format(prev_app_dt_e))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            prev_app_dt_e = None

        day = dt_m.date()
        if row[9] != "" and row[10] != "":
            app_t_s = datetime.datetime.strptime(row[9], "%H:%M")
            app_t_e = datetime.datetime.strptime(row[10], "%H:%M")
            app_dt_s = datetime.datetime.combine(dt_m.date(), app_t_s.time())

            if app_dt_s < dt_m:
                app_dt_s = app_dt_s + oneday

            app_dt_e = datetime.datetime.combine(app_dt_s.date(), app_t_e.time())
            
            if app_dt_e < app_dt_s:
                app_dt_e = app_dt_e + oneday
            
            #print "Appoint from {} to {} = {}".format(app_dt_s, app_dt_e, (app_dt_e - app_dt_s))
        else:
            app_dt_s = None
            app_dt_e = None
            
        if prev_app_dt_s != None and prev_app_dt_s == dt_m:
            app = 1
            #print "Write appoint start with morning log"
            prev_app_dt_s = None

        if prev_app_dt_e != None and prev_app_dt_e == dt_m:
            app = 0
            #print "Write appoint stop with morning log"
            prev_app_dt_e = None

        #print "{0} sensor1={1:6.1f} sensor2={2:6.1f} sensor3={3:6.1f} elec={4:6d} app={5:d}".format(dt_m, s1_m, s2_m, s3_m, el_m, app)
        tsReleve = int(time.mktime(dt_m.timetuple()))
        if s1_m != None:
            cesiFile.write("-- {}\n".format(dt_m))
            cesiFile.write("insert into cesiLog values ({}, {}, {}, {}, {});\n".format(tsReleve, s1_m, s2_m, s3_m, app))
        if el_m != None:
            elecFile.write("-- {}\n".format(dt_m))
            elecFile.write("insert into elecLog values ({}, {});\n".format(tsReleve, el_m))        

        if prev_app_dt_s != None and prev_app_dt_s > dt_m and prev_app_dt_s < dt_s:
            app = 1
            #print "Write previous appoint start between morning log and evening log"
            #print "{} app={}".format(prev_app_dt_s, app)
            tsReleve = int(time.mktime(prev_app_dt_s.timetuple()))
            cesiFile.write("-- {}\n".format(prev_app_dt_s))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            prev_app_dt_s = None

        if app_dt_s != None and app_dt_s > dt_m and app_dt_s < dt_s:
            app = 1
            #print "Write appoint start between morning log and evening log"
            #print "{} app={}".format(app_dt_s, app)
            tsReleve = int(time.mktime(app_dt_s.timetuple()))
            cesiFile.write("-- {}\n".format(app_dt_s))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            app_dt_s = None

        if prev_app_dt_e != None and prev_app_dt_e > dt_m and prev_app_dt_e < dt_s:
            app = 0
            #print "Write previous appoint stop between morning log and evening log"
            #print "{} app={}".format(prev_app_dt_e, app)
            tsReleve = int(time.mktime(prev_app_dt_e.timetuple()))
            cesiFile.write("-- {}\n".format(prev_app_dt_e))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            prev_app_dt_e = None

        if app_dt_e != None and app_dt_e > dt_m and app_dt_e < dt_s:
            app = 0
            #print "Write appoint stop between morning log and evening log"
            #print "{} app={}".format(app_dt_e, app)
            tsReleve = int(time.mktime(app_dt_e.timetuple()))
            cesiFile.write("-- {}\n".format(app_dt_e))
            cesiFile.write("insert into cesiLog (dtCesi, appoint) values ({}, {});\n".format(tsReleve, app))
            app_dt_e = None
            
        if app_dt_s != None and app_dt_s == dt_s:
            app = 1
            #print "Write appoint start {} with evening log {}".format(app_dt_s, dt_s)
            app_dt_s = None

        if app_dt_e != None and app_dt_e == dt_s:
            app = 0
            #print "Write appoint stop {} with evening log {}".format(app_dt_e, dt_s)
            app_dt_e = None

        #print "{0} sensor1={1:6.1f} sensor2={2:6.1f} sensor3={3:6.1f} elec={4:6d} app={5:1d}".format(dt_s, s1_s, s2_s, s3_s, el_s, app)
        tsReleve = int(time.mktime(dt_s.timetuple()))
        if s1_s != None:
            cesiFile.write("-- {}\n".format(dt_s))
            cesiFile.write("insert into cesiLog values ({}, {}, {}, {}, {});\n".format(tsReleve, s1_s, s2_s, s3_s, app))        
        if el_s != None:
            elecFile.write("-- {}\n".format(dt_s))
            elecFile.write("insert into elecLog values ({}, {});\n".format(tsReleve, el_s))        
        
        # Save appoint start and stop for next round
        prev_app_dt_s = app_dt_s
        prev_app_dt_e = app_dt_e

cesiFile.close()
elecFile.close()