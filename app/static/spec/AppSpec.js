// Data context test suite
describe("Data context tests", function () {
    "use strict";

	var relevesListStorageKey = "Releves.RelevesListTest";
	
    it("Exists in the app", function () {
        expect(Releves.dataContext).toBeDefined();
    });

    it("Has init function", function () {
        expect(Releves.dataContext.init).toBeDefined();
    });

	it("Return a Releves array", function () {
		var relevesList = Releves.dataContext.getRelevesList();
		expect(relevesList instanceof Array).toBeTruthy();
	});
	
	it("Return an empty Releve", function () {
		var emptyReleve = Releves.dataContext.createEmptyReleve();
		expect(emptyReleve.id == "0").toBeTruthy();
		expect(emptyReleve.date.length !== 0).toBeTruthy();
		expect(emptyReleve.sensor1).toBeNull();
		expect(emptyReleve.sensor2).toBeNull();
		expect(emptyReleve.sensor3).toBeNull();
		expect(emptyReleve.elec).toBeNull();
		expect(emptyReleve.appoint === 0).toBeTruthy();
	});
	
	it("Return dummy releves from localStorage", function () {
		// Create some releves for the tests
		Releves.testHelper.createDummyReleves();
		
		Releves.dataContext.init(relevesListStorageKey);
		var relevesList = Releves.dataContext.getRelevesList();
		expect(relevesList.length > 0).toBeTruthy();
	});

	it("Return a Releve item", function () {
		var relevesList = Releves.dataContext.getRelevesList();
		console.log("List length=" + relevesList.length);
		// Pick an item in the middle of the list
		var pos = 0;
		if (relevesList.length > 1) {
			pos = relevesList.length / 2;
		}
		console.log("Position=" + pos);
		var tmpReleve = relevesList[pos];
		console.log("tmpReleve.id=" + tmpReleve.id);
		var id = tmpReleve.id;
		var releve = Releves.dataContext.getReleveById(id);
		console.log("releve.id=" + releve.id);
		
		expect(releve !== null).toBeTruthy();
		expect(releve.id.length !== 0).toBeTruthy();
		expect(releve.date.length !== 0).toBeTruthy();
		expect(releve.id === id).toBeTruthy();

	});

	it("Save a Releve to localStorage", function () {
		// Make sure the list is empty
		$.jStorage.deleteKey(relevesListStorageKey);
		var relevesList = $.jStorage.get(relevesListStorageKey);
		expect(relevesList).toBeNull();
		
		// Create a releve 
		var releveModel = new Releves.ReleveModel({
			id: 0,
			date: "2012-03-01 12:58:22",
			sensor1: 23.6,
			sensor2: 18.1,
			sensor3: 51.9,
			elec: 8522,
			appoint: 0,
			dirty: 1
		});
		
		var newId;
		var elecVal = 8660;
		
		// Save the new releve to localStorage
		Releves.dataContext.init(relevesListStorageKey);
		newId = Releves.dataContext.saveReleve(releveModel);
		
		// Should retrieve the releve (should be the only one...)
		relevesList = $.jStorage.get(relevesListStorageKey);
		var expectedReleve = relevesList[0];
		expect(expectedReleve instanceof Releves.ReleveModel).toBeTruthy;
		// When creating a new model, the Id shouldn't be 0
		expect(expectedReleve.id == newId).toBeTruthy;

		// Edit the releve (change the elec value)
		releveModel = expectedReleve;
		releveModel.elec = elecVal;
		
		// Save it
		Releves.dataContext.saveReleve(releveModel);
		// Retrieve it
		relevesList = $.jStorage.get(relevesListStorageKey);
		expectedReleve = relevesList[0];
		expect(expectedReleve instanceof Releves.ReleveModel).toBeTruthy;
		// When creating a new model, the Id shouldn't be 0
		expect(expectedReleve.elec == elecVal).toBeTruthy;
		
		// Clean the list
		$.jStorage.deleteKey(relevesListStorageKey);
	});
});
