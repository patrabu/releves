# encoding: utf-8

"""
    models.py
    ~~~~~~~~~

    This file describes the model of the database.

    :copyright: (c) 2013 by Patrick Rabu.
    :license: GPL-3, see LICENSE for more details.
"""

from app import db

APPOINT_OFF = 0
APPOINT_ON = 1


class CesiLog(db.Model):
    tCesi = db.Column(db.Integer, primary_key=True)
    sensor1 = db.Column(db.Float)
    sensor2 = db.Column(db.Float)
    sensor3 = db.Column(db.Float)
    appoint = db.Column(db.SmallInteger, default=APPOINT_OFF)

    def __repr__(self):
        return "<CesiLog dt={} s1={} s2={} s3={} app={}>".format(
            self.dtCesi, self.sensor1, self.sensor2, self.sensor3,
            self.appoint)


class ElecLog(db.Model):
    dtElec = db.Column(db.Integer, primary_key=True)
    elec = db.Column(db.Integer)

    def __repr__(self):
        return "<ElecLog dt={} elec={}>".format(self.dtElec, self.elec)
