
/**
	Chrome Extension Events
**************************************** */

//Event callback from Extension, for when the page has completed loading!
chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			//Page has loaded!
			Scrummy.init();
			
		}
	}, 10);
});


// Event callback from Extension, fires each time a new message is received.
// In this case, a message is when the URL is updated, in other words, when a
// Card is "opened" and "closed".
chrome.extension.onMessage.addListener(function(req, sender, sendResponse) {
	
	Scrummy.scrum();

});


/**
	All extension code!
**************************************** */


//Global namespace
var Scrummy = {

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


	// ----------------------------------------------------
    // Methods
    // ----------------------------------------------------
	init: function(){

		//this.navItem.on("click", {}, $.proxy(this.onNavClick, this));

		//Add HTML if required
		this.addMarkUp();

		//Bind events
		this.eventBinds();
	},

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

	eventBinds: function() {

		var _this = this; //context

		//Listener for Trello changes
		var DOMTimeout = null;
		    $(this.listCards).bind('DOMNodeInserted', function() {
		        if(DOMTimeout)
		            clearTimeout(DOMTimeout);

		    DOMTimeout = setTimeout(function() { 
		    	console.log('AJAX probably added something');

		    	_this.addMarkUp();
		    	_this.calculateAndDisplay();
		    	//updateColumnPointTally();

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
	},

	// All the math & Logic for adding and displaying points
	scrum: function() {

		console.log("Message receied!");

		var sidebar = $(this.sidebar);
		var newMarkup = '<div class="scrum-it-plugin">'+
							'<h3>Scrum</h3>'+
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
		var cardOverlay = $(".window-wrapper", ".window"),
			cardIsOpen = false;

		if(cardOverlay.children().length > 0) cardIsOpen = true;
		if(cardIsOpen) {
			sidebar.append(newMarkup);
		}

		//Run calculations
		this.calculateAndDisplay();

	},

	saveNewTitle: function(value) {
	  	$("h2.window-title-text").trigger("click");
	  	$("textarea.field", ".edit").val(value);
	  	$("input.js-save-edit").trigger("click"); //Save

	},

	saveNewComment: function(value) {
	  	$("textarea.new-comment-input", ".new-comment").trigger("click");
	  	$("textarea.new-comment-input", ".new-comment").val(value);
	  	$("input.js-add-comment", ".new-comment").trigger("click"); //Save
	},

	calculateAndDisplay: function() {

		var _this = this; //context


		$(_this.cardDetail).each(function() {
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

		// TODO: Find a better vent to hook into
		setTimeout(this.updateColumnPointTally, 500);
		
	},



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




} //Scrummy