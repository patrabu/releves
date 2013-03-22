Releves.testHelper = (function() {
	var createDummyReleves = function() {
		var relevesListStorageKey = "Releves.RelevesListTest";
		var releves = [];
		var relevesCount = 10;
		
		for (var i =0; i < relevesCount; i++) {
			var releve = Releves.dataContext.createEmptyReleve();

			releve.id = i + 1;
			releve.sensor1 = 10 + i;
			releve.sensor2 = 10 + (5 * i);
			releve.sensor3 = releve.sensor2 + 10 + (5 * i);
			releve.elec = 5000 + (150 * i);
			releve.appoint = (i % 2) ? 1 : 0;
			
			releves.push(releve);
			console.log("creation of a releve - id=" + releve.id);
		}
		
		$.jStorage.set(relevesListStorageKey, releves);
	};
	
	return {
		createDummyReleves: createDummyReleves
	}
})();