# encoding: utf-8

"""
    __init__.py
    ~~~~~~~~~~~

    Init file for the app package.

    :copyright: 2013 Patrick Rabu <patrick@rabu.fr>.
    :license: GPL-3, see LICENSE for more details.
"""

from flask import Flask
from flask.ext.mail import Mail
from config import MAIL_SERVER, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, ADMINS

app = Flask(__name__)
app.config.from_object('config')
app.config.from_envvar('RELEVES_SETTINGS', silent=True)

mail = Mail(app)

if not app.debug:
    import logging
    from logging.handlers import SMTPHandler, RotatingFileHandler

    credentials = None
    if MAIL_USERNAME or MAIL_PASSWORD:
        credentials = (MAIL_USERNAME, MAIL_PASSWORD)

    mail_handler = SMTPHandler((MAIL_SERVER, MAIL_PORT),
                               'noreply@' + MAIL_SERVER, ADMINS,
                               'releves failure', credentials)
    mail_handler.setLevel(logging.ERROR)
    app.logger.addHandler(mail_handler)

    file_handler = RotatingFileHandler('tmp/releves.log', 'a',
                                       1 * 1024 * 1024, 10)
    file_handler.setFormatter(logging.Formatter('''
            %(asctime)s %(levelname)s: %(message)s \
            [in %(pathname)s:%(lineno)d]
            '''))
    app.logger.setLevel(logging.ERROR)
    file_handler.setLevel(logging.WARNING)
    app.logger.addHandler(file_handler)
    app.logger.info('releves startup...')

from app import routes

