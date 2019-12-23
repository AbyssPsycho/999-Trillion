function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.itemContainer    = document.querySelector(".item-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata, itemData) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    self.justBought = itemData.justBought;

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.clearContainer(self.itemContainer);
    self.addItems(itemData);

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }

  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addItems = function (itemData) {

	var explanations = ["",
	"increases TPS(tile per swipe) by 1. cost: ",
	"increases TPS by 4. cost: ",
	"increases TPS by 32. cost: ",
	"increases TPS by 256. cost: ",
	"increases TPS by 2048. cost: ",
	"increases TPS by 32768. cost: ",
	"increases TPS by 524288. cost: ",
	"increases TPS by 8388608. cost: ",
	"+TPS by 2^28. cost: ",
	"+TPS by 2^33. cost: ",
	"+TPS by 2^38. cost: ",
	"+TPS by 2^44. cost: ",
	"adds more TPS every purchase. cost: "];

	for(var i=1; i<itemData.items.length; i++) {
		var wrapper     = document.createElement("div");
  	var inner1      = document.createElement("div");
  	var inner2      = document.createElement("div");
  	var inner3      = document.createElement("div");
		var classes = ["item", "item-" + i];
  	this.applyClasses(wrapper, classes);
  	inner1.classList.add("item-tile");
  	inner2.classList.add("item-explanation");
  	inner3.classList.add("item-cost");
  	if(Math.floor(itemData.itemCosts[i]) >= 1e7) {
  		inner3.classList.add("item-cost-small");
  	}
  	inner1.textContent = Math.floor(itemData.itemValues[i]);
  	inner2.textContent = explanations[i];
  	inner3.textContent = Math.floor(itemData.itemCosts[i]);
  	wrapper.buyerId = i;
  	var f = function(evt) {
  		evt = evt || window.event;
  		var tgt = evt.target || evt.srcElement;
  		var itemId = tgt.buyerId || tgt.parentElement.buyerId;
  		itemData.buyer(itemId);
  		evt.preventDefault();
  	};
  	var _f = function(evt) {
  		evt.preventDefault();
  	}
  	if(!('ontouchstart' in document.documentElement))
  	{
  		wrapper.addEventListener("click", f);
  		wrapper.addEventListener("touchstart", _f);
  	}
  	else
  	{
  		// wrapper.addEventListener("click", _f);
  		wrapper.addEventListener("touchstart", f);
  	}

  	wrapper.appendChild(inner1);
  	wrapper.appendChild(inner2);
  	wrapper.appendChild(inner3);
  	this.itemContainer.appendChild(wrapper);
  }
}

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

	var newTileClass = 0;
	var classLevel = [1, 8, 64, 512, 4096, 32768, 262144, 2097152, 16777216, 134217728, 1073741824, 8589934592, 1e12];
	var classTitle = ["2", "4", "8", "16", "32", "64", "128", "256", "512", "1024", "2048", "super", "ultra"];
	for(var k=0; k<classLevel.length; k++)	{
		if(tile.value >= classLevel[k])	{
			newTileClass = k;
		}
		else	{
			break;
		}
	}
  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + classTitle[newTileClass], positionClass];

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;

  if(self.justBought) {
    this.applyClasses(wrapper, classes);
  } else if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "gabrielecirulli");
  tweet.setAttribute("data-url", "http://git.io/2048");
  tweet.setAttribute("data-counturl", "http://gabrielecirulli.github.io/2048/");
  tweet.textContent = "Tweet";

  var text = "I scored " + this.score + " points at 2048, a game where you " +
             "join numbers to score high! #2048game";
  tweet.setAttribute("data-text", text);

  return tweet;
};
