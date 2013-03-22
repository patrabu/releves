RELEVES
=======

Web app to register temperatures from a solar water heating system.
I register from 3 sensors :

* the first one is the collector sensor;
* the second one is at the bottom of the tank;
* the last one is at the middle of the tank (near the electrical booster).

A switch indicates when the electrical booster is turned on or off.

In addition I register the global electrical consumption.

The data is stored in a sqlite3 database.

Requirements
------------

This web-app is powered by the [flask](http://flask.pocoo.org) python microframework.

The client-side uses [jquery](http://jquery.com) and [jquery mobile](http://jquerymobile.com) for the interface design, 
[jStorage](http://www.jstorage.info/) to cache data on the browser side.

Quickstart
----------
