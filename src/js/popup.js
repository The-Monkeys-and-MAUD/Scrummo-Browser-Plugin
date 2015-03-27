/**
	Scrummo:

	Popup & Settings
**************************************** */




// window.onload = function() {
// 	console.log("Loaded");
// }

var o = {

	sequences: {
		"fibonacci": "0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89",
		"doubling": "0, 1, 2, 4, 8, 16, 32, 64, 128"
	},

	choices: "#choices",
	pointSystem: "#pointSystem",
	btnSave: "#btnSave",
	status: "#status",
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
				self.displayChoices(choice);
			}
		});

		$(o.btnSave).on("click", {}, $.proxy(this.saveSettings, this));

		this.checkForStoredSettings();

	},


	checkForStoredSettings: function() {
		var storedSequence = localStorage.getItem("scrummo_sequence_setting");
		if(storedSequence && storedSequence!=null) {
			this.renderSequence(storedSequence);
			//TODO: Set dropdown value to the one selected
		}
	},

	/*
		Based on user input, display the appropriate sequence
		@choice | string 
	*/
	displayChoices: function(choice) {
		switch(choice) {
			case "0":
				this.renderSequence("fibonacci");
				break;
			case "1":
				this.renderSequence("doubling");
				break;
			case "2":
				this.renderSequence("custom");
				break;
			default:
				this.renderSequence("doubling");
				break;

		}

		
	},

	/*
		Create a list from the dequence of numbers chosen.
		@choice | string 
	*/

	renderSequence: function(choice) {

		console.log("HERE!");

		//Store sequence (temporarily in var)
		o.storedSeq = choice;

		//Turn into an array
		var seqArray = o.sequences[choice].split(",");
			o.newArray = o.sequences[choice];

		//Create a list of numbers from the sequence.
		$(o.choices).empty();
		for(var i=0; i<seqArray.length; i++) {
			$(o.choices).append( "<li>" + seqArray[i] + "</li>");
		}


	},

	/*
		Save the user defined settings that have been chosen!
	*/
	saveSettings: function() {
		if(o.newArray && o.newArray.length > 0) {
			this.flashStatus("Saved!");
			//TODO, IF CUSTOM, STORE THE ARRAY, NOT THE "TYPE"
			localStorage.setItem("scrummo_sequence_setting", o.storedSeq);
		}
		else {
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
			}, 2000)
		});
	}

}


//On page load.
$(document).on("ready",   scrummoSettings.init());


// function get() {

//   var prev = localStorage.getItem("said_prev"),
//     prevDiv = document.getElementById("prev");
    
//     if(prev) {
//       prevDiv.style.display = prev ? "block" : "none";
//       setText(prev);
//     }

//     console.log("Loaded!");

//     $("#choices").html("This is jquery bro!")
// }

// function setText(txt) {
//   var prevTxt = document.getElementById("prevtext");
//   if(txt) prevTxt.innerText = txt;
// }

// function save() {
//   var value = document.getElementById("textfield").value;
//   setText(value);
//   localStorage.setItem("said_prev", value);
// }

// window.onload = function() {
//   // get();

//   // document.getElementById('button').addEventListener('click', save);


// }