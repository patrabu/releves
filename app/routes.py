# encoding: utf-8

"""
    routes.py
    ~~~~~~~~~

    This file serves the urls for the web-app pages.

    :copyright: 2013, 2014 Patrick Rabu <patrick@rabu.fr>.
    :license: GPL-3, see LICENSE for more details.
"""

from datetime import datetime, timedelta
import time
import sqlite3
from flask import render_template, request, jsonify
from flask import _app_ctx_stack, make_response
from app import app


def get_db():
    """
    Opens a new database connection if there is none yet for the
    current application context.
    """
    top = _app_ctx_stack.top
    if not hasattr(top, 'sqlite_db'):
        sqlite_db = sqlite3.connect(app.config['DATABASE_URI'])
        sqlite_db.row_factory = sqlite3.Row
        top.sqlite_db = sqlite_db

    return top.sqlite_db


@app.teardown_appcontext
def close_db_connection(exception):
    """
    Closes the database again at the end of the request.
    """
    top = _app_ctx_stack.top
    if hasattr(top, 'sqlite_db'):
        top.sqlite_db.close()


@app.route("/api/getTS")
def get_ts():
    """
    Method to check if the server is onLine
    """
    return jsonify(content="OK")


@app.route("/api/get30DaysReleves")
def get_30_days_releves():
    """
    Retrieve the last 30 releves from now of from a date param
    """
    app.logger.debug("get30DaysReleves() - Begin.")
    last_day = datetime.today()

    arg_last_day = request.args.get("dt", None, type=int)
    if arg_last_day is not None:
        try:
            last_day = datetime.fromtimestamp(arg_last_day)
        except ValueError:
            app.logger.error(
                "Invalid request value for get30DaysReleves() : %s",
                str(arg_last_day))
            last_day = datetime.today()

    first_day = last_day - timedelta(days=30)
    app.logger.debug("Search releves between %s (%d) and %s (%d).",
                     first_day.isoformat(), time.mktime(first_day.timetuple()),
                     last_day.isoformat(), time.mktime(last_day.timetuple()))
    db = get_db()
    cur = db.execute('''
    select cesiLog.dtCesi 'dt', cesiLog.sensor1 's1', cesiLog.sensor2 's2',
    cesiLog.sensor3 's3', cesiLog.appoint 'app', elecLog.elec 'elec'
    from cesiLog
    left outer join elecLog on cesiLog.dtCesi = elecLog.dtElec
    where cesiLog.dtCesi > ? and cesiLog.dtCesi <= ?
    order by dt desc
    ''', (time.mktime(first_day.timetuple()),
          time.mktime(last_day.timetuple())))
    list_log = []
    rows = cur.fetchall()
    for row in rows:
        dt1 = datetime.fromtimestamp(row[0]).strftime(app.config['DT_FMT'])
        data = dict(id=int(row[0]), dt=dt1,
                    s1=row[1], s2=row[2], s3=row[3], app=row[4], elec=row[5])
        # app.logger.debug(data)
        list_log.append(data)
    app.logger.debug(list_log)
    app.logger.debug("get30DaysReleves() - End.")
    return jsonify(dict(RelevesList=list_log))


@app.route('/api/saveReleve', methods=['POST'])
def save():
    """
    Save e releve into the database.
    """
    # app.logger.debug("save() - Begin.")
    errors = []
    db = get_db()

    id = int(request.form["id"]) if request.form["id"] is not None else 0
    dt_releve = None
    dt = request.form["dt"] \
        if request.form["dt"] is not None \
        and request.form["dt"] != "" else None
    s1 = float(request.form["s1"]) \
        if request.form["s1"] is not None \
        and request.form["s1"] != "" else None
    s2 = float(request.form["s2"]) \
        if request.form["s2"] is not None \
        and request.form["s2"] != "" else None
    s3 = float(request.form["s3"]) \
        if request.form["s3"] is not None \
        and request.form["s3"] != "" else None
    appoint = request.form["app"] if request.form["app"] is not None else 0
    elec = int(request.form["elec"]) \
        if request.form["elec"] is not None else None
    app.logger.debug(
        "save() - Form: id={} d={} s1={} s2={} s3={} Appoint={} Elec={}"
        .format(id, dt, s1, s2, s3, appoint, elec))

    if dt is None or dt == "":
        errors.append(dict(field="date", message="The date is mandatory"))
    else:
        try:
            dt_releve = datetime.strptime(dt, app.config['DT_FMT'])
            if dt_releve > datetime.now():
                errors.append(dict(field="date",
                                   message="Date is in future."))
        except ValueError:
            errors.append(dict(field="date",
                               message="The date is incorrect"))

    if s2 > s3:
        errors.append(dict(
            field="sensor3",
            message="Sensor3 cannot be greater than sensor2"))

    if elec is not None:
        # Search the previous row to retrieve the electricity index
        ts_releve = int(time.mktime(dt_releve.timetuple()))
        db = get_db()
        cur = db.execute(
            'select max(dtElec) from elecLog where dtElec < :dtElec',
            {"dtElec": ts_releve})
        row = cur.fetchone()
        if row:
            # Get the electricity index
            # app.logger.debug("save() - Last row = %s", row[0])
            cur = db.execute('select elec from elecLog where dtElec = :dtElec',
                             {"dtElec": row[0]})
            row2 = cur.fetchone()
            if row2:
                # app.logger.debug("save() - Last electricity index = %s",
                #    row2[0])
                if elec < row2[0]:
                    app.logger.debug("save() - error elec: %d < %d",
                                     elec, row2[0])
                    errors.append(dict(
                        field="elec",
                        message="Electricity index is less than \
                        previous one {}."
                        .format(row2[0])))

    if len(errors) == 0:
        cur = db.cursor()
        # app.logger.debug("save() - Id=%s", id)
        try:
            if id <= 0:
                if s1 is not None or s2 is not None or s3 is not None:
                    # app.logger.debug("save() - insert cesiLog")
                    cur.execute('insert into cesiLog values (?, ?, ?, ?, ?)',
                                (ts_releve, s1, s2, s3, appoint))
                if elec is not None:
                    # app.logger.debug("save() - insert elecLog")
                    cur.execute('insert into elecLog values (?, ?)',
                                (ts_releve, elec))
            else:
                if s1 is not None or s2 is not None or s3 is not None:
                    # app.logger.debug("save() - update cesiLog")
                    cur.execute('''update cesiLog
                        set dtCesi=?, sensor1=?, sensor2=?,
                        sensor3=?, appoint=?
                        where dtCesi = ?''',
                                (ts_releve, s1, s2, s3, appoint, id))
                if elec is not None:
                    # app.logger.debug("save() - update elecLog")
                    cur.execute('''update elecLog
                        set dtElec=?, elec=? where dtElec = ?''',
                                (ts_releve, elec, id))
        except sqlite3.Error as e:
            app.logger.error("save() - DB error=", e)
        cur.close
        db.commit()
        # app.logger.debug("Id=%s", id)
        return jsonify(content={"returnCode": "OK", "id": ts_releve})
    else:
        for err in errors:
            app.logger.debug("save() - err={%s: %s}",
                             err['field'], err['message'])

        return jsonify(content={"returnCode": "KO", "errors": errors})


@app.route('/')
@app.route('/index')
@app.route('/index.html')
def index():
    app.logger.debug("index().")
    return render_template('index.html')


@app.route('/about.html')
def about():
    app.logger.debug("about().")
    return render_template('about.html')


@app.route('/manifest')
def manifest():
    app.logger.debug("manifest().")
    appcache = render_template('releves.manifest')
    app.logger.debug(appcache)
    res = make_response(appcache, 200)
    res.headers["Content-Type"] = "text/cache-manifest"
    return res


@app.route('/SpecRunner')
def spec_runner():
    return render_template('SpecRunner.html')
