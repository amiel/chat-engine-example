/*
 * auto_scroll.js
 * Amiel Martin
 * 2009-01-08
 *
 * a call to activeScroll will make the element scroll to the bottom
 * unless it looks like the user has already scrolled
 *
 * Adapted from: http://radio.javaranch.com/pascarello/2006/08/17/1155837038219.html
 */

var AutoScroll = function(scrollContainer) {
	this.bottomThreshold = 20;
	this.scrollContainerSelector = scrollContainer;
	this.do_scroll = false;
}

AutoScroll.prototype.get_height = function(scrollDiv) {
	if (scrollDiv.scrollHeight > 0)
		return scrollDiv.scrollHeight;
	else if (scrollDiv.offsetHeight > 0)
		return scrollDiv.offsetHeight;
	else
		return 0;
};


AutoScroll.prototype.before_update = function() {
	var scrollDiv = $(this.scrollContainerSelector)[0];
	if (!scrollDiv) return;
	
	var currentHeight = this.get_height(scrollDiv);

	if (currentHeight - scrollDiv.scrollTop - ((scrollDiv.style.pixelHeight) ? scrollDiv.style.pixelHeight : scrollDiv.offsetHeight) < this.bottomThreshold)
		this.do_scroll = true;
}



AutoScroll.prototype.after_update = function() {
	var scrollDiv = $(this.scrollContainerSelector)[0];
	if (!scrollDiv) return;
	
	var currentHeight = this.get_height(scrollDiv);

	if (this.do_scroll)
		scrollDiv.scrollTop = currentHeight;

	this.do_scroll = false;
	scrollDiv = null;
}



