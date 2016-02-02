/*
    ReleveModel.js
    ~~~~~~~~~~~~~~

    Model object of a releve.

    :copyright: 2013 Patrick Rabu <patrick@rabu.fr>.
    :license: GPL-3, see LICENSE for more details.
*/

Releves.ReleveModel = function (config) {
    "use strict";

    this.id = config.id;
    this.date = config.date;

    if (config.sensor1 !== null) {
        this.sensor1 = config.sensor1;
    } else {
        this.sensor1 = "";
    }

    if (config.sensor2 !== null) {
        this.sensor2 = config.sensor2;
    } else {
        this.sensor2 = "";
    }

    if (config.sensor3 !== null) {
        this.sensor3 = config.sensor3;
    } else {
        this.sensor3 = "";
    }

    if (config.elec !== null) {
        this.elec = config.elec;
    } else {
        this.elec = "";
    }

    this.appoint = config.appoint;
    this.dirty = config.dirty;
};

Releves.ReleveModel.prototype.isValid = function () {
    "use strict";

    var errors = [],
        error = {},
        dtNow, // Current date
        dt, // Input datetime string 
        ymd, // date part (year, month, day) of the input string
        hms, // Time part (hour, minutes, seconds) of the input string
        dtRel, // Convert datetime of the record
        s1Present = false,
        s2Present = false,
        s3Present = false,
        s1f = 0.0,
        s2f = 0.0,
        s3f = 0.0,
        elec = 0;

    if (this.date === null || this.date === "") {
        error.field = "date";
        error.message = "Date is mandatory.";
        console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
        errors.push(error);
    } else {
        dtNow = new Date();
        dt = this.date.split(" "); // Split the date and time parts
        ymd = dt[0].split("-"); // Split the date into individual parts
        hms = dt[1].split(":"); // Split the time into hours and minutes
        dtRel = new Date(ymd[0], ymd[1] - 1, ymd[2], hms[0], hms[1], hms[2]);
        if (dtRel > dtNow) {
            error.field = "date";
            error.message = "Date cannot be in the future.";
            console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
            errors.push(error);
        }
    }

    if (this.sensor1 !== null && this.sensor1 !== "") {
        s1f = parseFloat(this.sensor1);
        s1Present = true;
    }

    if (this.sensor2 !== null && this.sensor2 !== "") {
        s2f = parseFloat(this.sensor2);
        s2Present = true;
    }

    if (this.sensor3 !== null && this.sensor3 !== "") {
        s3f = parseFloat(this.sensor3);
        s3Present = true;
    }

    if ((s1Present && !s2Present && !s3Present) ||
        (s1Present && !s2Present && s3Present) ||
        (s1Present && s2Present && !s3Present) ||
        (!s1Present && !s2Present && s3Present) ||
        (!s1Present && s2Present && !s3Present) ||
        (!s1Present && s2Present && s3Present)) {
        errors.push({
            field: "sensor1",
            message: "All the sensors or none should be populate."
        });
        console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
    } else {
        if (s2f > s3f) {
            error.field = "sensor3";
            error.message = "Sensor 3 temperature cannot be greater than sensor 2 temperature.";
            errors.push(error);
            console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
        }
    }
    console.log("Releves.ReleveModel.isValid - S1=" + s1f + " S2=" + s2f + " S3=" + s3f);

    if (this.elec !== null && this.elec !== "") {
        elec = parseInt(this.elec, 10);
        if (elec <= 0) {
            error = {
                field: "elec",
                message: "Electricity index should be greater than 0."
            };
            console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
            errors.push(error);
        }
    } else {
        if (!s1Present && !s2Present && !s3Present) {
            error.field = "sensor1";
            error.message = "Sensors or electricity index should be populated.";
            console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
            errors.push(error);
        }
    }

    console.log("Releves.ReleveModel.isValid - Errors=" + errors);
    return errors;
};