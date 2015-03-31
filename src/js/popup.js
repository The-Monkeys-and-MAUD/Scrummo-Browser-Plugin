/**
	Scrummo:

	Popup & Settings
**************************************** */

var o = {

	sequences: {
		"fibonacci": "0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89",
		"doubling": "0, 1, 2, 4, 8, 16, 32, 64, 128",
		"custom" : ""
	},

	choices: "#choices",
	pointSystem: "#pointSystem",
	btnSave: "#btnSave",
	status: "#status",
	customValues: "textarea#custom_values",
	storedSeq: "",
	newArray: null

}

var scrummoSettings = {

	init: function( ) {
		var self = this;

		//Events
		$(o.pointSystem).on("change", function() {
			var choice = $(this).val();
			if(choice!="-1") {
				self.displayChoices( choice );
			}
		});

		$(o.btnSave).on("click", {}, $.proxy(this.saveSettings, this));

		//Check for saved data.
		this.checkForStoredSettings();

	

	},

	checkForStoredSettings: function() {

		var self = this;
		//var storedSequence = localStorage.getItem("scrummo_sequence_type");

		chrome.storage.sync.get("scrummo_sequence_type", function(data) {

			var storedSequence = data['scrummo_sequence_type'];

			if(storedSequence && storedSequence!=null) {
				self.renderSequence(storedSequence);
				
				//Update dropdown to stored value
				var storedVal = self.getChoiceValue(storedSequence);
				$(o.pointSystem).val(storedVal);

				//Update textarea
				if(storedSequence === "custom") {
					chrome.storage.sync.get("scrummo_sequence_data", function(data) {
						var storedCustomArray = data['scrummo_sequence_data'];
						$(o.customValues).val(storedCustomArray);
					});
					
				}
			}
			
		});
	},

	/*
		Return the name of the choice, based on a given value
		@value | string 
	*/
	getChoiceName: function(choice) { 

		var choiceName;

		switch(choice) {
			case "0":
				choiceName = "fibonacci";
				break;
			case "1":
				choiceName = "doubling";
				break;
			case "2":
				choiceName = "custom";
				break;
			default:
				choiceName = "doubling";
				break;
		}

		return choiceName;
	},


	/*
		Return the value of the choice, based on a given name string. This helper is primarily needed 
		when we're pulling data out of storage.
		@name | string 
	*/
	getChoiceValue: function(name) { 

		var value;

		switch(name) {
			case "fibonacci":
				value = "0";
				break;
			case "doubling":
				value = "1";
				break;
			case "custom":
				value = "2";
				break;
		}

		return value;
	},

	/*
		Based on user input, display the appropriate sequence
		@choice | string 
	*/
	displayChoices: function(choice) {
		this.renderSequence( this.getChoiceName(choice) );
	},

	/*
		Create a list from the dequence of numbers chosen.
		@choice | string 
	*/

	renderSequence: function(choice) {

		//Store sequence (temporarily)
		o.storedSeq = choice;

		//Empty list.
		$(o.choices).empty();

		if(choice!=="custom") {
			//Turn into an array
			var seqArray = o.sequences[choice].split(",");
				o.newArray = o.sequences[choice];

			//Create a list of numbers from the sequence.
			for(var i=0; i<seqArray.length; i++) {
				$(o.choices).append( "<li>" + seqArray[i] + "</li>");
			}
		} else {
			this.showAndStoreCustomNumbers();
		}

	},

	/*
		When a custom number system is chosen, show the UI to the user and 
		subsrquently store their values
	*/
	showAndStoreCustomNumbers: function() {	
		$(o.choices).append( "<li class='custom'>"+
			"<p>Enter a comma seperated list of numbers you would like to use (smallest to largest), and press save.</p>"+
			"<textarea id='custom_values' rows='10'></textarea>"+
			"</li>"
		);
	},

	/*
		Save the user defined settings that have been chosen!
	*/
	saveSettings: function() {

		var self = this,
			arrayToUse = "";

		if(o.storedSeq === "custom") {
			//Remove trailing commas
			arrayToUse = $(o.customValues).val().replace(/^[,\s]+|[,\s]+$/g, '');
			//Remove all spaces
			arrayToUse = arrayToUse.replace(/\s/g, '');
		} else {
			arrayToUse = o.newArray;
		}

		console.log(typeof arrayToUse);
		console.info(arrayToUse);

		if(arrayToUse.length > 0) {

			//Store the named type of data (e.g. fibonacci)
			chrome.storage.sync.set({'scrummo_sequence_type': o.storedSeq}, function() {});

			//Store the array/points to be used
	        chrome.storage.sync.set({'scrummo_sequence_data': arrayToUse}, function() {
				// Notify that we saved.
				self.flashStatus("Saved!");

				//Re-load page, to re-invoke the initCart() method in inject.js
				chrome.tabs.getSelected(null, function(tab) {
					chrome.tabs.reload(tab.id)
				});

	        });

		}
		else {
			//No data?
			this.flashStatus("Choose or create a sequence first!");
		}

	},

	/*
		Fades a status message in and out to alert the user of an action
		@message | string
	*/
	flashStatus: function(message) {
		$(o.status).html(message).fadeIn(200,function() {
			setTimeout(function() {
				$(o.status).fadeOut(200);
				window.close();
			}, 1000)
		});
	}

}


//On page load.
$(document).on("ready",   scrummoSettings.init());
