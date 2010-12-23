/*
	@chogger-bookmarklet.js
	Justin Beckwith
	
	Broswer issues (why things were done they way they were)
	---------------------------------------------------------------------
	# only firefox supports document.contentType for determining mime type.  So for every other browser we need to depend
	  upon the extension in the url, which is less than ideal.  We need this to know if I need to redirect to chogger without modifying the DOM
	# IE is a steamy sack of crap.  It required the following changes:
		- added onreadystatechange instead of using onload.  Script tags were inconsistent with what state they returned when done ('loaded' vs 'complete')
		- for some reason IE doesnt respent styles added via dom manipulation, unless the style tag is at the very bottom 
		- position: fixed won't work in ie6 (on your own there), and only works in ie7&8 if the doc type is correct (see html example).  I will try to detect and add if needed
		- still tries to follow a href tag when clicking on an image and dragging.  requires adding a new event on start drag to add prevention click handler, 
		  and removal of said handler to make sure site works right with regard to links.  
*/

// create javascript libraries required for main
if (typeof jQuery == 'undefined') {
	// include jquery
	var jQ = document.createElement('script');
	jQ.type = 'text/javascript';
	jQ.onload=getDependencies;
	jQ.onreadystatechange=function() { if(this.readyState=='loaded' || this.readyState=='complete') { getDependencies(); }};
	jQ.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js';
	document.body.appendChild(jQ);
} // end if 
else {
	getDependencies();
} // end else

//
// getDependencies
//
function getDependencies() {
	
	// make sure jqueryUI is loaded
	if (!jQuery.ui) {
	
		// get the link css tag
		var jQCSS = document.createElement('link');
		jQCSS.type = 'text/css';
		jQCSS.rel= 'stylesheet';
		jQCSS.href = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css';
		document.body.appendChild(jQCSS);
		
		// grab jquery ui
		var jQUI = document.createElement('script');
		jQUI.type = 'text/javascript';
		jQUI.src = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.7/jquery-ui.min.js';
		jQUI.onload=getDependencies;
		jQUI.onreadystatechange=function() {if(this.readyState=='loaded' || this.readyState=='complete') { getDependencies(); }};
		document.body.appendChild(jQUI);
	} // end if
	else {
		choggit();
	} // end else
} // end getDependencies function

//
// choggit - main
//
function choggit() {
	// only do this the first time the bar is loaded on the page
	if ($("#chgrBar").length == 0) {
		// append the styles and bar
		
		var barHtml =	"<div id='chgrBar'>\
							<div id='chgrBar-main' class='dragOff'>\
								<span id='chgrBar-thumbs'></span>\
								<span id='chgrBar-text'>drag images to the chogbar</span>\
								<span id='chgrBar-buttons'>\
									<a href='#' id='doneLink'>done</a>\
									<a href='#' id='cancelLink'>cancel</a>\
								</span>\
							</div>\
							<form action='http://www.chogger.com/bookmarklet/' method='post' id='frmChoggit'></form>\
						</div>\
						<style type='text/css'>\
								#chgrBar {color: #FFFFFF; font-size: 130%; font-weight: bold; left: 0; position: fixed; text-align: center; top: 0; width: 100%; z-index: 99998; display: none; }\
								#chgrBar-main {border-bottom: 3px solid #000000; padding: 7px 0;}\
								#chgrBar-buttons { display: block; float: right; margin-right: 20px; }\
								#chgrBar-buttons a,\
								#chgrBar-buttons a:visited,\
								#chgrBar-buttons a:link,\
								#chgrBar-buttons a:active,\
								#chgrBar-buttons a:hover\
									{ padding: 4px; font-size: 0.7em; border: 2px solid #008600; background-color: #00cb00; color: #FFFFFF; text-decoration: none; }\
								#chgrBar-thumbs img { padding-left: 2px; padding-right: 2px; cursor: hand; }\
								.chgr-hover { border: 3px solid #4476b8 }\
								.dragOff { background-color: #4476b8; }\
								.dropHover{background-color: #FF0000; border: 1px dashed #e5a8a8;}\
								.dragActive {background-color: #759fd6}\
								.dropHighlight{border: 1px solid #000000;}\
								.dragHelper {z-index: 99999; border: 1px solid #000000;}\
							</style>";
		$("body").append(barHtml);
		
		// chgrBar close evnet
		$("#cancelLink").click(function(e) {
			// hide the bar
			$("#chgrBar").fadeOut(750);

			// remove any img classes or handlers
			$("img").removeClass('chgr-hover').unbind().draggable("destroy");

			// reset the thumbnail span
			$("#chgrBar-thumbs").html('');

			// reset the text
			$("#chgrBar-text").html("drag images to the chogbar");
		});

		// done link click
		$("#doneLink").click(function(e) {
			var imgCount =  $("#chgrBar-thumbs img").length;
			if (imgCount == 0) {
				alert('No images selected.  Try again.');
			} // end if
			else {
				for (var i=0; i<imgCount; i++) {
					$("#frmChoggit").append("<input type='hidden' name='urls[" + i + "]' value='" + $($("#chgrBar-thumbs img")[i]).attr("src") + "'/>");
				} // end for
				$("#frmChoggit").submit();
			} // end else
		});
		
		// drag/drop code for the chogger bar
		$("#chgrBar-main").droppable({
			scope: 'toheader',
			drop: function( event, ui ) {

				$('#chgrBar-text').html('');
				// make sure the image isn't already up here
				if ($("#chgrBar-thumbs img[src=" + ui.draggable.attr('src') + "]").length == 0) {

					// add the thumbnail to the header
					$("#chgrBar-thumbs").append("<img src='" + ui.draggable.attr('src') + "' width='50' height='50' alt='drag out of header to remove' />");

					// set up the remove draggable event
					$("#chgrBar-thumbs img[src=" + ui.draggable.attr('src') + "]").draggable({
						scope: 'fromheader',
						revert: true,
						opacity: .75,
						cursor: 'move',
						cursorAt: { top: 35, left: 45 }
					});
				} // end if
			} // end drop function
		});
		
		// set up a drag source for the delete
		$("body").droppable({
			scope: 'fromheader',
			drop: function( event, ui ) {
				if ($("#chgrBar-thumbs img").length == 1) {
					$("#chgrBar-text").html("drag images to the chogbar");
				} // end if
				ui.draggable.remove();
				$("body").css("cursor","auto");
			} 
		});
		
	} // end if (first time the bar is loaded)
	
	// show the top bar when the script loads
	$("#chgrBar").fadeIn(750);
	
	// set up draggable
	$("img").draggable({
		scope: 'toheader',
		revert: true,
		opacity: .75,
		cursor: 'move',
		cursorAt: { top: 35, left: 45 },
		helper: function(event) {
			return $("<img src='" + $(this).attr('src') + "' width='50' height='50' class='dragHelper' />");
		},
		start: function(event, ui) {
			// disable a href tags during drag to appease internet explorer
			$("a").bind("click", aClickPreventHandler);
		},
		drag: function(event, ui) {
			if ($("#chgrBar-thumbs img").length == 0) {
				$('#chgrBar-text').html('drop the image here');
			} // end if
			$('#chgrBar-main').addClass('dragActive').removeClass('dragOff');
		},
		stop: function(event, ui) {
			if ($("#chgrBar-thumbs img").length == 0) {
				$("#chgrBar-text").html("drag images to the chogbar");
			} // end if
			else {
				$('#chgrBar-text').html('');
			} // end else
			$("#chgrBar-main").addClass('dragOff').removeClass("dragActive");
			setTimeout(function(){$("a").unbind("click", aClickPreventHandler);}, 300);
		}
	});
	
	// img roll over events
	$("img").hover(
		function(e) {
			$(this).addClass('chgr-hover');
		}, // end mouseover event
		function(e) {
			$(this).removeClass('chgr-hover');
		} // end mouseout event
	);
	
	
} // end main

// named click handler used for ie hack to allow non a href follows with drag n drop
var aClickPreventHandler = function(e) {
	e.preventDefault();
} // end aClickPreventHandler function
