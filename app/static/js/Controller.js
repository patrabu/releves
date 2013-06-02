/*
    Controller.js
    ~~~~~~~~~~~~~~

    Controller of the releves application.

    :copyright: (c) 2013 by Patrick Rabu.
    :license: GPL-3, see LICENSE for more details.
*/

Releves.controller = (function ($, dataContext, document) {

    // Storage key
    var relevesListStorageKey = "Releves.RelevesList";

    // Message in case of empty list
    var noReleveMsg = "<p>No releves</p>";

    // Pages identifiers
    var relevesListPageId = "releves-list-page";
    var relevesEditorPageId = "releves-editor-page";
    var relevesChartPageId = "releves-chart-page";

    // Objects selectors
    var relevesListSelector = "#releves-list-content";

    // Form objects selectors
    var relevesEditorFormSel = "#releves-editor-form"
    var relevesEditorIdSel = "#releves-editor-id";
    var relevesEditorDateSel = "#releves-editor-date";
    var relevesEditorSensor1Sel = "#releves-editor-sensor1";
    var relevesEditorSensor2Sel = "#releves-editor-sensor2";
    var relevesEditorSensor3Sel = "#releves-editor-sensor3";
    var relevesEditorElecSel = "#releves-editor-elec";
    var relevesEditorAppointSel = "#releves-editor-appoint";
    var relevesEditorSaveBtnSel = "#releves-editor-save";

    // Dialog selector
    var releveInvalidDialogSel = "#releve-invalid-dialog";

    // Dialog transition
    var defaultDialogTrsn = { transition: "slideup" };

    // Reference to the current item
    var currentReleve = null;

    var init = function () {
        if (navigator.onLine) {
            synchronizeReleves();
            loadRelevesListFromServer();
        }
        dataContext.init(relevesListStorageKey);

        var d = $(document);
        d.on("pagechange", onPageChange);
        d.on("pagebeforechange", onPageBeforeChange);
        d.on("tap", relevesEditorSaveBtnSel, onSaveReleveBtnTapped);
    };

    var saveReleveToServer = function(releve) {
        // Send the data using post
        var dataString = "id=" + releve.id + "&dt=" + escape(releve.date);
        dataString += "&s1=" + releve.sensor1 + "&s2=" + releve.sensor2 + "&s3=" + releve.sensor3 ;
        dataString += "&elec=" + releve.elec + "&app=" + releve.appoint;
        $.ajax({
            url: 'saveReleve',
            type: 'POST',
            data: dataString,
            async: false,
            timeout: 2000,
            success: function( data ) {
                if (data.content.returnCode == "OK") {
                    releve.id = data.content.id;
                    releve.dirty = 0;
                } else {
                    errors = data.content.errors;
                    hasErrors = true;
                    console.log("save - errs=" + errs);
                }
            },
            error: function( data ) {
                alert("Error saving releve");
            }
        });
    };

    var onPageChange = function (event, data) {
        var toPageId = data.toPage.attr("id");
        var fromPageId = null;

        if (data.options.fromPage) {
            fromPageId = data.options.fromPage.attr("id");
        }

        switch(toPageId) {
            case relevesListPageId:
                resetCurrentReleve();
                renderRelevesList();
                break;
            case relevesEditorPageId:
                if (fromPageId == relevesListPageId) {
                    renderSelectedReleve(data);
                }
                break;
            case relevesChartPageId:
                renderChart();
                break;
        }
    }

    var onPageBeforeChange = function (event, data) {

        if (typeof data.toPage === "string") {

            var url = $.mobile.path.parseUrl(data.toPage);

            if ($.mobile.path.isEmbeddedPage(url)) {
                data.options.queryString = $.mobile.path.parseUrl(url.hash.replace(/^#/, "")).search.replace("?", "");
            }
        }
    };

    var onSaveReleveBtnTapped = function (event, data) {
        var fieldSel = "";
        // Remove previous error classes and messages
        $(releveInvalidDialogSel + " #releve-errors").empty();
        for (var key in currentReleve) {
            field = $("#releve-editor-" + key);
            label = $("label[for='releves-editor-" + key + "']");
            if (label.hasClass("error")) {
                label.removeClass("error");
            }
            if (field.hasClass("error")) {
                field.removeClass("error");
            }
        }

        var hasErrors = false;
        var errors = checkRelevesForm();

        if (errors.length == 0) {
            currentReleve.id = $(relevesEditorIdSel).val();
            currentReleve.date = $(relevesEditorDateSel).val();
            currentReleve.sensor1 = $(relevesEditorSensor1Sel).val();
            currentReleve.sensor2 = $(relevesEditorSensor2Sel).val();
            currentReleve.sensor3 = $(relevesEditorSensor3Sel).val();
            currentReleve.elec = $(relevesEditorElecSel).val();
            currentReleve.appoint = $(relevesEditorAppointSel).val();

            errors = currentReleve.isValid();
        }

        if (errors.length == 0) {
            // Indicator that the releve is not save to the server
            currentReleve.dirty = 1;

            // No errors
            if (isOnLine()) {
                // save Releve on the server
                saveReleveToServer(currentReleve);
            }
            // Save to localStorage
            dataContext.saveReleve(currentReleve);

            returnToRelevesListPage();
        }

        if (errors.length != 0) {
            // Show the errors
            var label;
            for (var i = 0; i < errors.length; i++) {
                errMsg = errors[i];
                $("#releves-editor-" + errMsg.field).addClass("error");
                label = $("label[for='releves-editor-" + errMsg.field + "']");
                label.addClass("error");
                $(releveInvalidDialogSel + " #releve-errors").append("<p>" + errMsg.message + "</p>");
            }
            $.mobile.changePage(releveInvalidDialogSel, defaultDialogTrsn);
        }
    };

    var resetCurrentReleve = function() {
        currentReleve = null;
    };

    var returnToRelevesListPage = function() {
        $.mobile.changePage("#" + relevesListPageId,
            {transition: "slide", reverse: true});
    };

    // Transform a query string to an object :
    // "?a=5&b=hello+world"  -> { a: 5, b: "hello world"}
    var queryStringToObj = function(queryString) {
        var queryStringObj = {};
        var e;
        var a = /\+/g;  // Replace + symbol with a space
        var r = /([^&;=]+)=?([^&;]*)/g;
        var d = function (s) { return decodeURIComponent(s.replace(a, " ")); };

        e = r.exec(queryString);
        while (e) {
            queryStringObj[d(e[1])] = d(e[2]);
            e = r.exec(queryString);
        }

        return queryStringObj;
    };

    // Put the releve data in the form
    var renderSelectedReleve = function(data) {
        var u = $.mobile.path.parseUrl(data.options.fromPage.context.URL);
        var re = "^#" + relevesEditorPageId;

        if (u.hash.search(re) !== -1) {
            var queryStringObj = queryStringToObj(data.options.queryString);

            var paramId = queryStringObj["id"];
            var releveId = 0;
            if (paramId != null) {
                releveId = parseInt(paramId);
            }
            if (releveId !== 0) {
                currentReleve = dataContext.getReleveById(releveId);
            }
            if (currentReleve == null) {
                currentReleve = dataContext.createEmptyReleve();
            }

            // Populate the fields
            $(relevesEditorIdSel).val(currentReleve.id);
            $(relevesEditorDateSel).val(currentReleve.date);
            $(relevesEditorSensor1Sel).val(currentReleve.sensor1);
            $(relevesEditorSensor2Sel).val(currentReleve.sensor2);
            $(relevesEditorSensor3Sel).val(currentReleve.sensor3);
            $(relevesEditorElecSel).val(currentReleve.elec);
            $(relevesEditorAppointSel).val(currentReleve.appoint);

            // Focus on the first sensor field
            $(relevesEditorSensor1Sel).focus();
        }
    };

    // Put the releve data in the form
    var renderChart = function(data) {
        var data = dataContext.getSensorsForChart();
        for (var i = 0; i < data.length; i++) {
            console.log("data[" + i + "]" + data[i]);
            for (var j = 0; j < data[i].length; j++) {
                console.log("data[" + i + "," + j + "]" + data[i][j]);
            }
        }
        $.plot($("#placeholder"),
           [ { data: data.s1, label: "Sensor 1 (&deg;C)" },
             { data: data.s2, label: "Sensor 2 (&deg;C)" },
             { data: data.s3, label: "Sensor 3 (&deg;C)" }],
           {
               xaxes: [ { mode: 'time' } ],
               legend: { position: 'nw' }
           });

    };

    var checkRelevesForm = function() {
        var errors = [];
        var required = false, pattern, patternOk = true, re;
        var value, valMin, valMax;

        // Check Id
        var releveId = parseInt($(relevesEditorIdSel).val());

        // Check date
        value = $(relevesEditorDateSel).val().trim();
        required = $(relevesEditorDateSel).prop("required");
        pattern = $(relevesEditorDateSel).prop("pattern");
        if (required && (value == "" || value == null)) {
            errMsg = {field : "date", message: "The date is mandatory."};
            errors.push(errMsg);
        } else {
            if (pattern != null && pattern != "undefined") {
                re = new RegExp('^(?:' + pattern + ')$')
                if (!re.test(value)) {
                    errMsg = {field : "date", message: "Invalid date."};
                    errors.push(errMsg);
                }
            }
        }

        value = $(relevesEditorSensor1Sel).val().trim();
        required = $(relevesEditorSensor1Sel).prop("required");
        pattern = $(relevesEditorSensor1Sel).prop("pattern");
        patternOk = true;
        valMin = $(relevesEditorSensor1Sel).prop("min");
        valMax = $(relevesEditorSensor1Sel).prop("max");
        if (value == null || value == "") {
            if (required) {
                errMsg = {field : "sensor1", message: "The 1st sensor temperature is mandatory."};
                errors.push(errMsg);
            }
        } else {
            if (pattern != null && pattern != "undefined") {
                re = new RegExp('^(?:' + pattern + ')$')
                if (!re.test(value)) {
                    errMsg = {field : "sensor1", message: "Incorrect value for the 1st sensor"};
                    errors.push(errMsg);
                    patternOk = false;
                }
            }

            if (patternOk) {
                if ((valMin != null && valMin != "undefined") && parseFloat(value) < parseFloat(valMin)) {
                    errMsg = {field : "sensor1", message: "The 1st sensor temperature is below the minimum."};
                    errors.push(errMsg);
                }
                if ((valMax != null && valMax != "undefined") && parseFloat(value) > parseFloat(valMax)) {
                    errMsg = {field : "sensor1", message: "The 1st sensor temperature is above the maximum."};
                    errors.push(errMsg);
                }
            }
        }

        value = $(relevesEditorSensor2Sel).val().trim();
        required = $(relevesEditorSensor2Sel).prop("required");
        pattern = $(relevesEditorSensor2Sel).prop("pattern");
        patternOk = true;
        valMin = $(relevesEditorSensor2Sel).prop("min");
        valMax = $(relevesEditorSensor2Sel).prop("max");
        if (value == null || value == "") {
            if (required) {
                errMsg = {field : "sensor2", message: "The 2nd sensor temperature is mandatory."};
                errors.push(errMsg);
            }
        } else {
            if (pattern != null && pattern != "undefined") {
                re = new RegExp('^(?:' + pattern + ')$')
                if (!re.test(value)) {
                    errMsg = {field : "sensor2", message: "Incorrect value for the 2nd sensor."};
                    errors.push(errMsg);
                    patternOk = false;
                }
            }

            if (patternOk) {
                if ((valMin != null && valMin != "undefined") && parseFloat(value) < parseFloat(valMin)) {
                    errMsg = {field : "sensor2", message: "The 2nd sensor temperature is below the minimum."};
                    errors.push(errMsg);
                }
                if ((valMax != null && valMax != "undefined") && parseFloat(value) > parseFloat(valMax)) {
                    errMsg = {field : "sensor2", message: "The 2nd sensor temperature is above the maximum."};
                    errors.push(errMsg);
                }
            }
        }

        value = $(relevesEditorSensor3Sel).val().trim();
        required = $(relevesEditorSensor3Sel).prop("required");
        pattern = $(relevesEditorSensor3Sel).prop("pattern");
        patternOk = true;
        valMin = $(relevesEditorSensor3Sel).prop("min");
        valMax = $(relevesEditorSensor3Sel).prop("max");
        if (value == null || value == "") {
            if (required) {
                errMsg = {field : "sensor3", message: "The 3rd sensor temperature is mandatory."};
                errors.push(errMsg);
            }
        } else {
            if (pattern != null && pattern != "undefined") {
                re = new RegExp('^(?:' + pattern + ')$')
                if (!re.test(value)) {
                    errMsg = {field : "sensor3", message: "Invalid value for the 3rd sensor."};
                    errors.push(errMsg);
                    patternOk = false;
                }
            }

            if (patternOk) {
                if ((valMin != null && valMin != "undefined") && parseFloat(value) < parseFloat(valMin)) {
                    errMsg = {field : "sensor3", message: "The 3rd sensor temperature is below the minimum."};
                    errors.push(errMsg);
                }
                if ((valMax != null && valMax != "undefined") && parseFloat(value) > parseFloat(valMax)) {
                    errMsg = {field : "sensor3", message: "The 3rd sensor temperature is above the maximum."};
                    errors.push(errMsg);
                }
            }
        }

        value = $(relevesEditorElecSel).val().trim();
        required = $(relevesEditorElecSel).prop("required");
        pattern = $(relevesEditorElecSel).prop("pattern");
        patternOk = true;
        valMin = $(relevesEditorElecSel).prop("min");
        valMax = $(relevesEditorElecSel).prop("max");
        if (value == null || value == "") {
            if (required) {
                errMsg = {field : "elec", message: "The electricity index is mandatory."};
                errors.push(errMsg);
            }
        } else {
            if (pattern != null && pattern != "undefined") {
                re = new RegExp('^(?:' + pattern + ')$')
                if (!re.test(value)) {
                    errMsg = {field : "elec", message: "Invalid value for the electricity index."};
                    errors.push(errMsg);
                    patternOk = false;
                }
            }

            if (patternOk) {
                if ((valMin != null && valMin != "undefined") && parseFloat(value) < parseFloat(valMin)) {
                    errMsg = {field : "elec", message: "Electricity index is below the minimum."};
                    errors.push(errMsg);
                }
                if ((valMax != null && valMax != "undefined") && parseFloat(value) > parseFloat(valMax)) {
                    errMsg = {field : "elec", message: "Electricity index is above the minimum."};
                    errors.push(errMsg);
                }
            }
        }

        return errors;
    };

    var renderRelevesList = function() {
        var relevesList = dataContext.getRelevesList();
        var view = $(relevesListSelector);
        view.empty();

        if (relevesList.length === 0) {
            view.append($(noReleveMsg));
        } else {
            var relevesCount = relevesList.length;
            var releve, li, link, h1, img, p1, p2;
            var ul = $("<ul id=\"releves-list\" data-role=\"listview\"></ul>");
            view.append(ul);
            for (var i = 0; i < relevesCount; i++) {
                releve = relevesList[i];
                link = $("<a></a>").attr({"href": "#releves-editor-page?id=" + releve.id, "data-url": "#releves-editor-page?id=" + releve.id});
                h1 = $("<h1></h1>").text(releve.date);
                if (releve.dirty == 1) {
                    console.log("releve id=" + releve.id + " date=" + releve.date + " dirty");
                    //h1.attr('data-icon', 'alert');
                    img = $("<img >").attr({"src": "static/img/warning.png", "alt": "local data", "width": "24px", "height": "24px" });
                    h1.append(img);
                }
                link.append(h1);
                if (releve.sensor1 != null && releve.sensor1 != "") {
                    p1 = $("<p></p>");
                    p1.append("S1 = <strong>" + releve.sensor1 + "</strong> &deg;C - ");
                    p1.append("S2 = <strong>" + releve.sensor2 + "</strong> &deg;C - ");
                    p1.append("S3 = <strong>" + releve.sensor3 + "</strong> &deg;C");
                    link.append(p1);
                }
                p2 = $("<p></p>");
                p2.append("&Eacute;lec. = <strong>" + releve.elec + "</strong> kW/h - ");
                p2.append("Appoint : <strong>" + ((releve.appoint===1) ? "0n" : "Off") + "</strong>");
                link.append(p2);
                li = $("<li></li>").append(link);
                ul.append(li);

            }
            // Apply JQueryMobile enhancements to the list
            $(relevesListSelector).trigger("create");
        }
    };

    /* ========================================== *
     * Save local releves to the server.          *
     * ========================================== */
    var synchronizeReleves = function() {
        console.log("synchronizeReleves - Begin.");
        var relevesList = $.jStorage.get(relevesListStorageKey);
        var hasErrors = false;

        if (relevesList) {
            $.each(relevesList, function(i, item) {
                // Item need to be saved.
                if (item.dirty == 1) {
                    console.log("Save dirty item - id=" +item.id + " - dt=" +item.date + " - s1=" + item.sensor1 + " - s2=" + item.sensor2 + " - s3=" + item.sensor3 + " - elec=" + item.elec + " - app=" + item.appoint);
                    saveReleveToServer(item);
                    console.log("Dirty item - id=" +item.id + " - dirty=" +item.dirty);
                }
            });
            if (hasErrors) {
                var pbSynchro = "Error when synchronizing data";
                $(releveInvalidDialogSel + " #releve-errors").append("<p>" + pbSynchro + "</p>");
                $.mobile.changePage(releveInvalidDialogSel, defaultDialogTrsn);
            }
            $.jStorage.set(relevesListStorageKey, relevesList);
        }
        console.log("synchronizeReleves - End.");
    };

    /* ========================================== *
     * Check if we can connect to the server.     *
     * ========================================== */
    var isOnLine = function() {
        if (!navigator.onLine) {
            return false;
        }

        var ret = false;
        var req = $.ajax({
            url: "getTS",
            async: false,
            timeout: 2000});

        req.done(function() {
            ret = true;
        });

        req.fail(function() {
            ret = false;
        });
        return ret;
    };


    /* =============================================== *
     * Load the last 30 days releves from the server.  *
     * =============================================== */
    var loadRelevesListFromServer = function() {
        console.log("loadRelevesListFromServer() - Begin.");
        $.ajax({
            url: '/get30DaysReleves',
            dataType: 'json',
            async: false,
            timeout: 2000,
            success: function (data) {
                var releves = data.RelevesList;
                var serverReleves = [];
                for (var i =0; i < releves.length; i++) {
                    var releve = new Releves.ReleveModel({
                        id: releves[i].id,
                        date: releves[i].dt,
                        sensor1: releves[i].s1,
                        sensor2: releves[i].s2,
                        sensor3: releves[i].s3,
                        elec: releves[i].elec,
                        appoint: releves[i].app,
                        dirty: 0
                    });
                    serverReleves[i] = releve;
                }
                $.jStorage.set(relevesListStorageKey, serverReleves);
            },
            error: function (data) {
                console.log("loadRelevesListFromServer() - error().data=" + data);
            }
        });
        console.log("loadRelevesListFromServer() - End.");
    };


    return {
        isOnLine: isOnLine,
        synchronizeReleves: synchronizeReleves,
        init: init
    };
})(jQuery, Releves.dataContext, document);


$(document).bind("mobileinit", function() {
    console.log("mobileinit");
    Releves.controller.init();
});
