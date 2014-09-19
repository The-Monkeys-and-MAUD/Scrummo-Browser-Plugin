
/**
	Chrome Extension Events
**************************************** */

//Event callback from Extension, for when the page has completed loading!
chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			//Initial page load. Only get's called the once, because Trello is full of the AJAX stuff.
			//Scrummo.checkContentTypeByURL("from FULL load ");
		}
	}, 10);
});

// Event callback from Extension, fires each time a new message is received.
// In this case, a message is when the URL is updated, in other words, when a
// Card is "opened" and "closed".
chrome.extension.onMessage.addListener(function(req, sender, sendResponse) {
	Scrummo.checkContentTypeByURL();	
});


/**
	All extension code!
**************************************** */


//Global namespace
var Scrummo = {

	// ----------------------------------------------------
    // Constants
    // ----------------------------------------------------

	badges: '.badges',
	cardDetail: '.list-card-details',
	list: '.list',
	listHeader: '.list-header',
	listCards: '.list-cards',
	listTitle: '.list-card-title',
	sidebar: ".window-sidebar",
	boardID: null,
	boardIDSet: false,

	eventsBound: false,


	// ----------------------------------------------------
    // Methods
    // ----------------------------------------------------

	 /*
		checkContentTypeByURL()
		Checks the current URL, to determine if the content is a board or a card and responds accordingly.
		This method is called constantly by the Chrome event listener for this app.
	**/
	checkContentTypeByURL:function() {



		var url = window.location.href;
		var urlType = url.split("trello.com/");
		urlType = urlType[1][0]; //expects b or c

		//Board or card?
		if(urlType) {

			
			this.eventBinds(); //Binds events (if needed);
			this.addMarkUp(); //Adds mark-up (if needed);

			switch(urlType.toLowerCase()) {
				case "b":
					this.initBoard();
					this.checkBoardID();
					break;

				case "c":
					this.initCard();
					break;
			}
		}
	},

 

	//Check when board changes
	checkBoardID: function() {
		if(!this.boardIDSet) {
			this.boardID = this.getBoardIDFromURL();
			this.boardIDSet = true;
		}

		//Do they match?
		if(this.boardID == this.getBoardIDFromURL()) {
			// Do nothing...
			//console.info("Same board... " + this.getBoardIDFromURL());
		} else {
			this.boardIDSet = false;
			this.eventsBound = false;

			this.addMarkUp(); 
			this.eventBinds();
			//console.info("DIFFERENT board... " + this.getBoardIDFromURL());

		}
	},

	// Helper: Will return ONLY the board ID.
	getBoardIDFromURL: function() {
		var boardURL = window.location.href.split("trello.com/b/");
		var boardID = boardURL[1].split("/");
		return boardID[0];
	},


	/*
		addMarkUp()
		Adds the required mark-up placeholders for the points, tallies etc. Will only add it if it's not already there
	**/
	addMarkUp: function(){

		$(this.badges, this.cardDetail).each(function() {
			if($(this).find(".card-count").length==0) {
				$(this).prepend('<div class="badge card-count" data-points="x" title=""></div>');
			}
		});	

		$(this.listHeader, this.list).each(function() {
			if($(this).find(".list-total").length==0) {
				$(this).append('<span class="list-total"></span>');
			}		
		});
		
	},

	/*
		eventBinds()
		All events required for this application. NOTE: Because of the AJAX nature of the site, all events are delegated using on()
	**/
	eventBinds: function() {

		var _this = this; //context

		//Only bind if we need to...
		
		if(!this.eventsBound) {
			this.eventsBound = true;

			//Listener for Trello changes
			var DOMTimeout = null;
			    $(this.listCards).bind('DOMNodeInserted', function() {
			        if(DOMTimeout)
			            clearTimeout(DOMTimeout);

			    DOMTimeout = setTimeout(function() { 
			    	console.info('AJAX probably added something');
			    	//This is here because when NEW cards or lists are made, they do not have the mark-up needed!
			    	_this.addMarkUp();
			    	//Re-do calculations...
			    	_this.calculateAndDisplay();

			    }, 150);
			});

			//Use initiated events
			$(document).on( "click", "li.add-points", function() {
				var title =  $("h2.window-title-text"),
					titleText = title.text(),
					points = $(this).data("points"),
					commentPoints = "[[" + points + "]]",
					titleTextPoints = "("  + points + ") ";

				var updatedTitle;

				if(titleText.indexOf("(") === 0|| titleText.indexOf("(") === 1) {
					//Already scored!
					var cleanTitleText = titleText.replace(/\((.*\) )/g, '');//.replace(/\s/g, ''); 

					//TODO: REMOVE SPACES IS INTERFERRING WITH TITLE...
					updatedTitle = titleTextPoints.concat(cleanTitleText);

				} else {
					//Run save functions..
					updatedTitle = titleTextPoints.concat(titleText);
				}

				_this.saveNewTitle(updatedTitle);
				_this.saveNewComment(commentPoints);
			});

		} else {
			console.warn("Events already added!");
		}

	},


	/*
		initBoard()
		Initalizes a board, binds the events, and calculates the point tallys.
	**/
	initBoard: function() {
		this.calculateAndDisplay();
	},

	/*
		initCard()
		Initalizes a card, adds the mark-up required and re-calculates points
	**/
	initCard: function() {

		var _this = this; //context

		var sidebar = $(this.sidebar);
		var newMarkup = '<div class="scrummo-sidebar">'+
							'<h3>Add Points</h3>'+
							'<ul class="points clearfix">'+
								'<li class="add-points" data-points="32">32</li>'+
								'<li class="add-points" data-points="16">16</li>'+
								'<li class="add-points" data-points="8">8</li>'+
								'<li class="add-points" data-points="4">4</li>'+
								'<li class="add-points" data-points="2">2</li>'+
								'<li class="add-points" data-points="1">1</li>'+
								'<li class="add-points" data-points="0">0</li>'+
							'</ul>'+
						'</div>';


		//Has a page loaded with card already open?
		var cardOverlay = $(".window-wrapper", ".window");

		//Keeps checking if the window is open, and only then will inject the mark-up required.
		var checkCardWindowIsOpen = setInterval(function() {
			if (cardOverlay.children().length > 0) {
				clearInterval(checkCardWindowIsOpen); //Clear self...
				if(sidebar.find(".scrummo-sidebar").length <= 0) {
					$(_this.sidebar).append(newMarkup);
					_this.calculateAndDisplay();
				}
			}
		}, 200);
		
	},

	/*	
		saveNewTitle()
		@value = string | New value
		Updates the title of the card, and re-saves it to the Trello's DB.
	**/
	saveNewTitle: function(value) {
	  	$("h2.window-title-text").trigger("click");
	  	$("textarea.field", ".edit").val(value);
	  	$("input.js-save-edit").trigger("click"); //Save

	},

	/*	
		saveNewComment : Adds a new comment to the card with the value given.
		@value = string | New value
	**/
	saveNewComment: function(value) {
	  	$("textarea.new-comment-input", ".new-comment").trigger("click");
	  	$("textarea.new-comment-input", ".new-comment").val(value);
	  	$("input.js-add-comment", ".new-comment").trigger("click"); //Save
	},


	/*	
		calculateAndDisplay()
		Calculates the number of points in a given card, based on the title e.g. (8) and displays them on the board.
	**/
	calculateAndDisplay: function() {

		var _this = this; //context

		$(this.cardDetail).each(function() {
			var myText = $(this).find(_this.listTitle).text();
			var points = 0; //Defaults to ZERO

			 if(myText.indexOf("(") != -1 && myText.indexOf(")")!= -1) {
			 	//We have points to compute...
			 	var array = myText.split(/[()]+/).filter(function(e) { return e; });

			 	//Points
			 	points = array[1];

			 	//Store this cards points as attributes
			 	$(".card-count", this).attr({
			 		'data-points': points,
			 		'title': 'This card has '+points+' points.'
			 	}).html(points);

				 //Strip brackets from the title and store as attribute
				 $(this).find(_this.listTitle).data("title", array[2]);
			 }

			 //Now use the data-points for the HTML of the points
			 //Strip brackets from the title
			 $(this).find(_this.listTitle).html( $(_this.listTitle, this).data("title") );
		});

		this.updateColumnPointTally();
		
	},


	/*	
		updateColumnPointTally
		Calculates the number of points in a given column (list). Will display the updated tally in the list header.
	**/
	updateColumnPointTally: function() {
		var count;
		$(".list").each(function() {		
			count = 0; //reset count;
			$(".card-count", this).each(function(){
				if($(this).text()) {
					count += parseInt( $(this).text() );
				}
			});
			$(".list-total", this).html("");
			$(".list-total", this).html(count);
		});
	}




} //Scrummo