/*
    ReleveModel.js
    ~~~~~~~~~~~~~~

    Model object of a releve.

    :copyright: 2013 Patrick Rabu <patrick@rabu.fr>.
    :license: GPL-3, see LICENSE for more details.
*/

Releves.ReleveModel = function(config) {
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

Releves.ReleveModel.prototype.isValid = function() {
	"use strict";

	var errors = [];
    var error = {};

	if (this.date == null || this.date == "") {
        error.field = "date";
        error.message = "La date est obligatoire.";
        console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
        errors.push(error);
	} else {
		var dtNow = new Date();
		var dt = this.date.split(" "); // Split the date and time parts
		var ymd = dt[0].split("-"); // Split the date into individual parts
		var hms = dt[1].split(":"); // Split the time into hours and minutes
		var dtRel = new Date(ymd[0], ymd[1] - 1, ymd[2], hms[0], hms[1], hms[2]);
		if (dtRel > dtNow) {
            error.field = "date";
            error.message = "La date ne peut pas &ecirc;tre dans le futur.";
            console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
			errors.push(error);
		}
	}

	var s1Present = false, s2Present = false, s3Present = false, elecPresent = false;
	var s1f = 0.0, s2f = 0.0, s3f = 0.0;

	if (this.sensor1 != null && this.sensor1 != "") {
		s1f = parseFloat(this.sensor1);
		s1Present = true;
	}

	if (this.sensor2 != null && this.sensor2 != "") {
		s2f = parseFloat(this.sensor2);
		s2Present = true;
	}

	if (this.sensor3 != null && this.sensor3 != "") {
		s3f = parseFloat(this.sensor3);
		s3Present = true;
	}

	if (( s1Present && !s2Present && !s3Present) ||
		( s1Present && !s2Present &&  s3Present) ||
		( s1Present &&  s2Present && !s3Present) ||
		(!s1Present && !s2Present &&  s3Present) ||
		(!s1Present &&  s2Present && !s3Present) ||
		(!s1Present &&  s2Present &&  s3Present)) {
        errors.push({field: "sensor1", message: "Aucune sonde ou toutes les sondes doivent être renseignées."});
        console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
	} else {
		if (s2f > s3f) {
            error.field = "sensor3";
            error.message = "La temp&eacute;rature de la sonde 3 ne peut pas être supérieure à celle de la sonde 2.";
            errors.push(error);
            console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
		}
	}
	console.log("Releves.ReleveModel.isValid - S1=" + s1f + " S2=" + s2f + " S3=" + s3f);

	if (this.elec != null && this.elec != "") {
		var elec = parseInt(this.elec);
		if (elec <= 0) {
            error = {field: "elec", message: "L'index d'électricité doit être supérieur à 0."};
            console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
            errors.push(error);
		}
	} else {
		if (!s1Present && !s2Present && ! s3Present) {
            error.field = "sensor1";
            error.message = "Les sondes ou l'électricité doivent être renseignées.";
            console.log("Releves.ReleveModel.isValid - error[" + error.field + "]=" + error.message);
            errors.push(error);
		}
	}

	console.log("Releves.ReleveModel.isValid - Errors=" + errors);
	return errors;
};
