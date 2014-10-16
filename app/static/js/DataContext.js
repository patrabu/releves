/*
    DataContext.js
    ~~~~~~~~~~~~~~

    Function to manage the list of Releves.

    :copyright: 2013 Patrick Rabu <patrick@rabu.fr>.
    :license: GPL-3, see LICENSE for more details.
*/

var Releves = Releves || {};

Releves.dataContext = (function ($) {
    "use strict";

    var relevesList = [];
    var relevesListStorageKey;

    var init = function(storageKey) {
        console.log("Releves.dataContext.init - Begin - storageKey=" + storageKey);
        relevesListStorageKey = storageKey;
        loadRelevesListFromLocalStorage();
        console.log("Releves.dataContext.init - End");
    }

    var getRelevesList = function() {
        return relevesList;
    };

    var getReleveById = function(id) {
        var releve = null;
        var tmpReleve = null;
        for (var i = 0; i < relevesList.length; i++) {
            tmpReleve = relevesList[i];
            if (tmpReleve.id == id) {
                releve = new Releves.ReleveModel({
                    id: tmpReleve.id,
                    date: tmpReleve.date,
                    sensor1: tmpReleve.sensor1,
                    sensor2: tmpReleve.sensor2,
                    sensor3: tmpReleve.sensor3,
                    elec: tmpReleve.elec,
                    appoint: tmpReleve.appoint,
                    dirty: tmpReleve.dirty
                    });
                break;
            }
        }
        return releve;
    };

    var getSensorsForChart = function() {
        var sensors = {};
        var s1 = [];
        var s2 = [];
        var s3 = [];

        var releve = null;
        var tmpReleve = null;
        var timestamp;
        for (var i = 0; i < relevesList.length; i++) {
            if (relevesList[i].sensor1 == "") {
                continue;
            }
            var sensor1 = [];
            timestamp = relevesList[i].id * 1000;
            sensor1[0] = timestamp;
            sensor1[1] = relevesList[i].sensor1;
            s1.push(sensor1);
            var sensor2 = [];
            sensor2[0] = timestamp;
            sensor2[1] = relevesList[i].sensor2;
            s2.push(sensor2);
            var sensor3 = [];
            sensor3[0] = timestamp;
            sensor3[1] = relevesList[i].sensor3;
            s3.push(sensor3);
        }
        sensors.s1 = s1;
        sensors.s2 = s2;
        sensors.s3 = s3;
        return sensors;
    };

    var createEmptyReleve = function() {

        // Format a date like this 'YYYY-mm-DD HH:MM:SS'
        var now = new Date();
        var y = now.getFullYear();
        var mo = now.getMonth() + 1;
        var d = now.getDate();
        var h = now.getHours();
        var mn = now.getMinutes();
        var s = now.getSeconds();
        var ymd = y + '-' + (mo < 10 ? '0' + mo : mo) + '-' + (d < 10 ? '0' + d : d);
        var hms = (h < 10 ? '0' + h : h) + ':' + (mn < 10 ? '0' + mn : mn) + ':' + (s < 10 ? '0' + s : s);
        var dt = ymd + ' ' + hms;

        var releveModel = new Releves.ReleveModel({
            id: 0,
            date: dt,
            sensor1: null,
            sensor2: null,
            sensor3: null,
            elec: null,
            appoint: 0,
            dirty: 1
        });
        return releveModel;
    };

    var saveReleve = function(releveModel) {
        var found = false;
        var i;
        console.log("Releves.DataContext.saveReleve - releveModel.id=" + releveModel.id);

        // Not a new releve or new releve save online
        if (releveModel.id != 0) {
            console.log("Releves.DataContext.saveReleve - update");
            for (i = 0; i < relevesList.length; i++) {
                if (relevesList[i].id == releveModel.id) {
                    relevesList[i] = releveModel;
                    found = true;
                    break;
                }
            }
        } else {
            // Offline creation
            // Create an id with the date
            var dt = releveModel.date.split(" "); // Split the date and time parts
            var ymd = dt[0].split("-"); // Split the date into individual parts
            var hms = dt[1].split(":"); // Split the time into hours and minutes
            var dtRel = new Date(ymd[0], ymd[1] - 1, ymd[2], hms[0], hms[1], hms[2]);

            releveModel.id = dtRel.getTime() / 1000 * -1; // Negative value to indicate a creation
            console.log("Releves.DataContext.saveReleve - insert id=" + releveModel.id);
        }

        // if not found or new releve, put it at the beginning of the list
        if (!found) {
            relevesList.splice(0, 0, releveModel);
        }

        // Save the list to localStorage
        saveRelevesListToLocalStorage();

        return releveModel.id;
    };

    var loadRelevesListFromLocalStorage = function() {
        console.log("Releves.dataContext.loadRelevesListFromLocalStorage - Begin");
        var localReleves = simpleStorage.get(relevesListStorageKey);
        console.log("Releves.dataContext.loadRelevesListFromLocalStorage - localReleves size=" + localReleves.length);
        if (localReleves != null) {
            relevesList = localReleves;
        } else {
            relevesList = [];
        }
        console.log("Releves.dataContext.loadRelevesListFromLocalStorage - relevesList size=" + relevesList.length);
    };

    var saveRelevesListToLocalStorage = function() {
        console.log("Releves.dataContext.saveRelevesListToLocalStorage - Begin");
        relevesList.sort(compareReleves);
        simpleStorage.set(relevesListStorageKey, relevesList);
        console.log("Releves.dataContext.saveRelevesListToLocalStorage - relevesList=" + relevesList);
    };

    var compareReleves = function(r1, r2) {
        return Math.abs(r2.id) - Math.abs(r1.id);
    };

    return {
        createEmptyReleve: createEmptyReleve,
        getRelevesList: getRelevesList,
        getReleveById: getReleveById,
        getSensorsForChart: getSensorsForChart,
        saveReleve: saveReleve,
        init: init
    }

} (jQuery));
