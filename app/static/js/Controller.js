/*
    Controller.js
    ~~~~~~~~~~~~~~

    Controller of the releves application.

    :copyright: 2013 Patrick Rabu <patrick@rabu.fr>.
    :license: GPL-3, see LICENSE for more details.
*/

/*jslint browser: true, devel: true, debug: true, plusplus: true, vars: true */

Releves.controller = (function ($, dataContext, document) {

    "use strict";

    // Storage key
    var relevesListStorageKey = "Releves.RelevesList",

        // Message in case of empty list
        noReleveMsg = "<p>No releves</p>",

        // Pages identifiers
        relevesListPageId = "releves-list-page",
        relevesEditorPageId = "releves-editor-page",
        relevesChartPageId = "releves-chart-page",

        // Objects selectors
        relevesListSelector = "#releves-list-content",

        // Form objects selectors
        relevesEditorIdSel = "#releves-editor-id",
        relevesEditorDateSel = "#releves-editor-date",
        relevesEditorSensor1Sel = "#releves-editor-sensor1",
        relevesEditorSensor2Sel = "#releves-editor-sensor2",
        relevesEditorSensor3Sel = "#releves-editor-sensor3",
        relevesEditorElecSel = "#releves-editor-elec",
        relevesEditorAppointSel = "#releves-editor-appoint",
        relevesEditorSaveBtnSel = "#releves-editor-save",

        // Dialog selector
        releveInvalidDialogSel = "#releve-invalid-dialog";

    // Dialog transition
    var defaultDialogTrsn = {
        transition: "slideup"
    };

    // Reference to the current item
    var currentReleve = null;


    /* ========================================== *
     * Check if we can connect to the server.     *
     * ========================================== */
    var isOnLine = function () {
        if (!navigator.onLine) {
            return false;
        }

        var ret = false;
        var req = $.ajax({
            url: "api/getTS",
            async: false,
            timeout: 2000
        });

        req.done(function () {
            ret = true;
        });

        req.fail(function () {
            ret = false;
        });
        return ret;
    };


    // Transform a query string to an object :
    // "?a=5&b=hello+world"  -> { a: 5, b: "hello world"}
    var queryStringToObj = function (queryString) {
        var queryStringObj = {};
        var e;
        var a = /\+/g; // Replace + symbol with a space
        var r = /([^&;=]+)=?([^&;]*)/g;
        var d = function (s) {
            return decodeURIComponent(s.replace(a, " "));
        };

        e = r.exec(queryString);
        while (e) {
            queryStringObj[d(e[1])] = d(e[2]);
            e = r.exec(queryString);
        }

        return queryStringObj;
    };


    var saveReleveToServer = function (releve) {
        // Send the data using post
        var dataString = "id=" + releve.id + "&dt=" + encodeURIComponent(releve.date);
        dataString += "&s1=" + releve.sensor1 + "&s2=" + releve.sensor2 + "&s3=" + releve.sensor3;
        dataString += "&elec=" + releve.elec + "&app=" + releve.appoint;
        var errs;
        $.ajax({
            url: 'api/saveReleve',
            type: 'POST',
            data: dataString,
            async: false,
            timeout: 2000,
            success: function (data) {
                if (data.content.returnCode === "OK") {
                    releve.id = data.content.id;
                    releve.dirty = 0;
                } else {
                    errs = data.content.errors;
                    console.log("save - errs=" + errs);
                }
            },
            error: function () {
                alert("Error saving releve");
            }
        });
    };


    /* ========================================== *
     * Save local releves to the server.          *
     * ========================================== */
    var synchronizeReleves = function () {
        console.log("synchronizeReleves - Begin.");
        var relevesList = simpleStorage.get(relevesListStorageKey);
        var hasErrors = false;

        if (relevesList) {
            $.each(relevesList, function (i, item) {
                // Item need to be saved.
                if (item.dirty === 1) {
                    console.log("Save dirty item " + i + " - id=" + item.id + " - dt=" + item.date + " - s1=" + item.sensor1 + " - s2=" + item.sensor2 + " - s3=" + item.sensor3 + " - elec=" + item.elec + " - app=" + item.appoint);
                    saveReleveToServer(item);
                    console.log("Dirty item - id=" + item.id + " - dirty=" + item.dirty);
                }
            });
            if (hasErrors) {
                var pbSynchro = "Error when synchronizing data";
                $(releveInvalidDialogSel + " #releve-errors").append("<p>" + pbSynchro + "</p>");
                $.mobile.changePage(releveInvalidDialogSel, defaultDialogTrsn);
            }
            simpleStorage.set(relevesListStorageKey, relevesList);
        }
        console.log("synchronizeReleves - End.");
    };


    /* =============================================== *
     * Load the last 30 days releves from the server.  *
     * =============================================== */
    var loadRelevesListFromServer = function () {
        console.log("loadRelevesListFromServer() - Begin.");
        $.ajax({
            url: 'api/get30DaysReleves',
            dataType: 'json',
            async: false,
            timeout: 2000,
            success: function (data) {
                var serverReleves = [];
                $.each(data.RelevesList, function (i, item) {
                    var releve = new Releves.ReleveModel({
                        id: item.id,
                        date: item.dt,
                        sensor1: item.s1,
                        sensor2: item.s2,
                        sensor3: item.s3,
                        elec: item.elec,
                        appoint: item.app,
                        dirty: 0
                    });
                    serverReleves.push(releve);
                });
                simpleStorage.set(relevesListStorageKey, serverReleves);
            },
            error: function (data) {
                console.log("loadRelevesListFromServer() - error().data=" + data);
            }
        });
        console.log("loadRelevesListFromServer() - End.");
    };


    var resetCurrentReleve = function () {
        currentReleve = null;
    };


    var renderRelevesList = function () {
        var relevesList = dataContext.getRelevesList();
        var view = $(relevesListSelector);
        view.empty();

        if (relevesList.length === 0) {
            view.append($(noReleveMsg));
        } else {
            var li, link, h1, img, p1, p2;
            var ul = $("<ul id=\"releves-list\" data-role=\"listview\"></ul>");
            view.append(ul);
            $.each(relevesList, function (i, releve) {
                link = $("<a></a>").attr({
                    "href": "#releves-editor-page?id=" + releve.id,
                    "data-url": "#releves-editor-page?id=" + releve.id
                });
                h1 = $("<h1></h1>").text(releve.date);
                if (releve.dirty === 1) {
                    console.log("releve id=" + releve.id + " date=" + releve.date + " dirty");
                    img = $("<img >").attr({
                        "src": "static/img/warning.png",
                        "alt": "local data",
                        "width": "24px",
                        "height": "24px"
                    });
                    h1.append(img);
                }
                link.append(h1);
                if (releve.sensor1 !== null && releve.sensor1 !== "") {
                    p1 = $("<p></p>");
                    p1.append("S1 = <strong>" + releve.sensor1 + "</strong> &deg;C - ");
                    p1.append("S2 = <strong>" + releve.sensor2 + "</strong> &deg;C - ");
                    p1.append("S3 = <strong>" + releve.sensor3 + "</strong> &deg;C");
                    link.append(p1);
                }
                p2 = $("<p></p>");
                p2.append("&Eacute;lec. = <strong>" + releve.elec + "</strong> kW/h - ");
                p2.append("Appoint : <strong>" + ((releve.appoint === 1) ? "0n" : "Off") + "</strong>");
                link.append(p2);
                li = $("<li></li>").append(link);
                ul.append(li);
            });

            // Apply JQueryMobile enhancements to the list
            $(relevesListSelector).trigger("create");
        }
    };


    // Put the releve data in the form
    var renderSelectedReleve = function (data) {
        var u = $.mobile.path.parseUrl(data.options.fromPage.context.URL);
        var re = "^#" + relevesEditorPageId;

        if (u.hash.search(re) !== -1) {
            var queryStringObj = queryStringToObj(data.options.queryString);

            var paramId = queryStringObj.id;
            var releveId = 0;
            if (paramId !== null) {
                releveId = parseInt(paramId, 10);
            }
            if (releveId !== 0) {
                currentReleve = dataContext.getReleveById(releveId);
            }
            if (currentReleve === null) {
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


    // Render the releve data in a chart
    var renderChart = function (data) {
        data = dataContext.getSensorsForChart();
        $.plot($("#placeholder"), [
            {
                data: data.s1,
                label: "Sensor 1 (&deg;C)"
            },
            {
                data: data.s2,
                label: "Sensor 2 (&deg;C)"
            },
            {
                data: data.s3,
                label: "Sensor 3 (&deg;C)"
            }], {
            xaxes: [{
                mode: 'time'
                }],
            legend: {
                position: 'nw'
            }
        });

    };


    var returnToRelevesListPage = function () {
        $.mobile.changePage("#" + relevesListPageId, {
            transition: "slide",
            reverse: true
        });
    };


    var checkFormElement = function (formElement) {
        var errMsg;
        var required = false,
            pattern,
            patternOk = true,
            re;
        var elementId, value, valMin, valMax;

        elementId = formElement.prop("id");
        value = formElement.val().trim();
        required = formElement.prop("required");
        pattern = formElement.prop("pattern");
        patternOk = true;
        valMin = formElement.prop("min");
        valMax = formElement.prop("max");
        if (required && (value === null || value === "")) {
            errMsg = {
                field: elementId,
                message: "The 1st sensor temperature is mandatory."
            };
        } else {
            if (pattern !== null && pattern !== "undefined") {
                re = new RegExp('^(?:' + pattern + ')$');
                if (!re.test(value)) {
                    errMsg = {
                        field: elementId,
                        message: "Incorrect value for the 1st sensor"
                    };
                    patternOk = false;
                }
            }

            if (patternOk) {
                if ((valMin !== null && valMin !== "undefined") && parseFloat(value) < parseFloat(valMin)) {
                    errMsg = {
                        field: elementId,
                        message: "The 1st sensor temperature is below the minimum."
                    };
                }
                if ((valMax !== null && valMax !== "undefined") && parseFloat(value) > parseFloat(valMax)) {
                    errMsg = {
                        field: elementId,
                        message: "The 1st sensor temperature is above the maximum."
                    };
                }
            }
        }
        if (errMsg !== undefined) {
            return errMsg;
        }
    };


    var checkRelevesForm = function () {
        var errors = [],
            errMsg;

        // Check Id
        var releveId = parseInt($(relevesEditorIdSel).val(), 10);
        if (releveId === undefined) {
            errMsg = {
                field: "id",
                message: "Incorrect value for the Id."
            };
            errors.push(errMsg);
        }

        // Check date
        errMsg = checkFormElement($(relevesEditorDateSel));
        if (typeof errMsg !== 'undefined') {
            errors.push(errMsg);
        }
        errMsg = checkFormElement($(relevesEditorSensor1Sel));
        if (typeof errMsg !== 'undefined') {
            errors.push(errMsg);
        }
        errMsg = checkFormElement($(relevesEditorSensor2Sel));
        if (typeof errMsg !== 'undefined') {
            errors.push(errMsg);
        }
        errMsg = checkFormElement($(relevesEditorSensor3Sel));
        if (typeof errMsg !== 'undefined') {
            errors.push(errMsg);
        }
        errMsg = checkFormElement($(relevesEditorElecSel));
        if (typeof errMsg !== 'undefined') {
            errors.push(errMsg);
        }

        return errors;
    };


    var onPageChange = function (event, data) {
        var toPageId = data.toPage.attr("id");
        var fromPageId = null;

        if (data.options.fromPage) {
            fromPageId = data.options.fromPage.attr("id");
        }

        switch (toPageId) {
        case relevesListPageId:
            resetCurrentReleve();
            renderRelevesList();
            break;
        case relevesEditorPageId:
            if (fromPageId === relevesListPageId) {
                renderSelectedReleve(data);
            }
            break;
        case relevesChartPageId:
            renderChart();
            break;
        }
    };


    var onPageBeforeChange = function (event, data) {

        if (typeof data.toPage === "string") {

            var url = $.mobile.path.parseUrl(data.toPage);

            if ($.mobile.path.isEmbeddedPage(url)) {
                data.options.queryString = $.mobile.path.parseUrl(url.hash.replace(/^#/, "")).search.replace("?", "");
            }
        }
    };


    var onSaveReleveBtnTapped = function (event, data) {
        var key = "",
            field = "",
            label = "";
        event.stopPropagation();
        event.stopImmediatePropagation();
        // Remove previous error classes and messages
        $(releveInvalidDialogSel + " #releve-errors").empty();
        for (key in currentReleve) {
            if (currentReleve.hasOwnProperty(key)) {
                field = $("#releve-editor-" + key);
                label = $("label[for='releves-editor-" + key + "']");
                if (label.hasClass("error")) {
                    label.removeClass("error");
                }
                if (field.hasClass("error")) {
                    field.removeClass("error");
                }
            }
        }

        var errors = checkRelevesForm();

        if (errors.length === 0) {
            currentReleve.id = $(relevesEditorIdSel).val();
            currentReleve.date = $(relevesEditorDateSel).val();
            currentReleve.sensor1 = $(relevesEditorSensor1Sel).val();
            currentReleve.sensor2 = $(relevesEditorSensor2Sel).val();
            currentReleve.sensor3 = $(relevesEditorSensor3Sel).val();
            currentReleve.elec = $(relevesEditorElecSel).val();
            currentReleve.appoint = $(relevesEditorAppointSel).val();

            errors = currentReleve.isValid();

            if (errors.length === 0) {

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
        }

        if (errors.length !== 0) {
            // Show the errors
            $.each(errors, function (i, errMsg) {
                $(errMsg.field).addClass("error");
                label = $("label[for='" + errMsg.field + "']");
                label.addClass("error");
                $(releveInvalidDialogSel + " #releve-errors").append("<p>" + errMsg.message + "</p>");
            });
            $.mobile.changePage(releveInvalidDialogSel, defaultDialogTrsn);
        }
    };


    var init = function () {
        if (isOnLine()) {
            synchronizeReleves();
            loadRelevesListFromServer();
        }
        dataContext.init(relevesListStorageKey);

        var d = $(document);
        d.on("pagechange", onPageChange);
        d.on("pagebeforechange", onPageBeforeChange);
        d.on("tap", relevesEditorSaveBtnSel, onSaveReleveBtnTapped);
    };


    return {
        isOnLine: isOnLine,
        synchronizeReleves: synchronizeReleves,
        init: init
    };
}(jQuery, Releves.dataContext, document));


$(document).bind("mobileinit", function () {
    "use strict";
    Releves.controller.init();
});