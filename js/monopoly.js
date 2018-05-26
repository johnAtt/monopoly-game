var Monopoly = {};//nameSpace//
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 200;
Monopoly.doubleCounter = 0;


//main function//
Monopoly.init = function () {
    $(document).ready(function () {
        Monopoly.adjustBoardSize();
        $(window).bind("resize", Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();
    });
};

//pop up to determine number of player//
Monopoly.start = function () {
    Monopoly.showPopup("intro")
};

//active the dice effect first step to move players//
Monopoly.initDice = function () {
    $(".dice").click(function () {
        if (Monopoly.allowRoll) {
            Monopoly.rollDice();
        }
    });
};

//allowed at every moment to determine who is the current player during a turn, really helpful for future function//
Monopoly.getCurrentPlayer = function () {
    return $(".player.current-turn");
};

//allowed at every moment to determine where is a player by finding the class .cell associate to a player, really helpful for future function//
Monopoly.getPlayersCell = function (player) {
    return player.closest(".cell");
};

//allowed at every moment to determine what is the money of a player, really helpful for future function//
Monopoly.getPlayersMoney = function (player) {
    return parseInt(player.attr("data-money"));
};

//every turn after earning or loosing money (rent/buy/chanceCard/CommunityCard/goCell), this function update the current player money//
Monopoly.updatePlayersMoney = function (player, amount) {
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;
    // if after sum the money is < 0 , the player is remove and a pop up is fading in//
    if (playersMoney < 0) {
        var popup = Monopoly.getPopup("broke");
        popup.find("button").unbind("click").bind("click", Monopoly.closePopup);
        Monopoly.showPopup("broke");
        Monopoly.removePlayer(player);
    }
    //update the attribute "data-money" and display a sound//
    player.attr("data-money", playersMoney);
    player.attr("title", player.attr("id") + ": $" + playersMoney);
    Monopoly.playSound("chaching");
}

Monopoly.removePlayer = function (player) {
    // add a class that display none a player and loop into his properties to delete every attribute/ID/class link to him//
    player.addClass('removed');
    var playerId = player.attr("id");
    var properties = $("." + playerId);
    if (properties.length > 0) {
        for (var i = 0; i < properties.length; i++) {
            properties[i].setAttribute("data-owner", "");
            properties[i].setAttribute("data-rent", "");
            properties[i].removeAttribute("data-owner");
            properties[i].removeAttribute("data-rent");
            properties[i].classList.add("available");
            properties[i].classList.remove(playerId);
        }
    }
    //avoiding a delete player to have a last turn even if he has been removed//
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    currentPlayerTurn.addClass("current-turn");
}

//
Monopoly.rollDice = function (steps) {
    //randomly turn the dice and adding attribute to them allowing css effects//
    var result1 = Math.floor(Math.random() * 6) + 1 ;
    var result2 = Math.floor(Math.random() * 6) + 1 ;
    $(".dice").find(".dice-dot").css("opacity", 0);
    $(".dice#dice1").attr("data-num", result1).find(".dice-dot.num" + result1).css("opacity", 1);
    $(".dice#dice2").attr("data-num", result2).find(".dice-dot.num" + result2).css("opacity", 1);
    //checking double and allowing extra turn or putting a player in jail after 3 turns//
    if (result1 == result2) {
        Monopoly.doubleCounter++;
        if (Monopoly.doubleCounter == 3) {
            var currentPlayer = Monopoly.getCurrentPlayer();
            Monopoly.handleGoToJail();
            Monopoly.sendToJail(currentPlayer);
            Monopoly.doubleCounter = 0;
            result1 = 0;
            result2 = 0;
        }
    } else {
        Monopoly.doubleCounter = 0;
    }
    // activating the right flow of function according of the players result through the function handleAction()//
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer, "move", result1 + result2);
};

    //effects to make the players move cells by cells the correct amount of numbers the random dice decided //
Monopoly.movePlayer = function (player, steps) {
    player.removeClass("smiley");
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function () {
        if (steps == 0) {
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        } else {
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    }, 200);
};

//function to determine which function call in what situation at the end of each turn//
Monopoly.handleTurn = function () {
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);

    if (playerCell.hasClass(player.attr("id"))) {
        player.addClass("smiley");
    }
    if (playerCell.is(".available.property")) {
        Monopoly.handleBuyProperty(player, playerCell);
    } else if (playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))) {
        Monopoly.handlePayRent(player, playerCell);
    } else if (playerCell.is(".go-to-jail")) {
        Monopoly.handleGoToJail(player);
    } else if (playerCell.is(".chance")) {
        Monopoly.handleChanceCard(player);
    } else if (playerCell.is(".community")) {
        Monopoly.handleCommunityCard(player);
    } else {
        Monopoly.setNextPlayerTurn();
    }

}

/* every turn this fuction is call to determine who is the next player to play .
(check if player in jail / if the last player played//or if the player have been removed)*/
Monopoly.setNextPlayerTurn = function () {
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player", ""));
    var nextPlayerId = playerId + 1;

    if (Monopoly.doubleCounter > 0 && !(currentPlayerTurn.is(".jailed"))) {
        nextPlayerId = playerId;
    } else {
        nextPlayerId = playerId + 1;
    }

    if (nextPlayerId > $(".player").length) {
        nextPlayerId = 1;
    }
    currentPlayerTurn.removeClass("current-turn");
    var nextPlayer = $(".player#player" + nextPlayerId);
    nextPlayer.addClass("current-turn");

    if (nextPlayer.is(".jailed")) {
        var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
        currentJailTime++;
        nextPlayer.attr("data-jail-time", currentJailTime);
        if (currentJailTime > 3) {
            nextPlayer.removeClass("jailed");
            nextPlayer.removeAttr("data-jail-time");
        }
        Monopoly.setNextPlayerTurn();
        return;
    }
    if (nextPlayer.hasClass("removed")) {
        Monopoly.setNextPlayerTurn();
        return;
    }
    Monopoly.closePopup();
    Monopoly.allowRoll = true;
};

//pop up to determine if a player wanna buy or not a property and allow a certain flow of function calling//
Monopoly.handleBuyProperty = function (player, propertyCell) {
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click", function () {
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")) {
            Monopoly.handleBuy(player, propertyCell, propertyCost);
        } else {
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};

//handle the payement of a rent if a player is on another player property//
Monopoly.handlePayRent = function (player, propertyCell) {
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click", function () {
        var properyOwner = $(".player#" + properyOwnerId);
        Monopoly.closeAndNextTurn();
        Monopoly.updatePlayersMoney(player, currentRent);
        Monopoly.updatePlayersMoney(properyOwner, -1 * currentRent);
    });
    Monopoly.showPopup("pay");
};

//show the pop up for jailTime //
Monopoly.handleGoToJail = function (player) {
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click", function () {
        Monopoly.handleAction(player, "jail");
    });
    Monopoly.showPopup("jail");
};

//Use of Ajax to randomly select cards form a server and show a pop up determining a specific action.//
Monopoly.handleChanceCard = function (player) {
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function (chanceJson) {
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", chanceJson["action"]).attr("data-amount", chanceJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("chance");
};

//Use of Ajax to randomly select cards form a server and show a pop up determining a specific action.//
Monopoly.handleCommunityCard = function (player) {
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function (chanceJson) {
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", chanceJson["action"]).attr("data-amount", chanceJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("community");
};

//giving a specif class and attribute, to put a player in jail + sound//
Monopoly.sendToJail = function (player) {
    player.addClass("jailed");
    player.attr("data-jail-time", 1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

//function to obtain a pop up and then be able to change the text or biend the button to specific action//
Monopoly.getPopup = function (popupId) {
    return $(".popup-lightbox .popup-page#" + popupId);
};

//calculating the price of property according to his position on the board//
Monopoly.calculateProperyCost = function (propertyCell) {
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group", "")) * 5;
    if (cellGroup == "rail") {
        cellPrice = 10;
    }
    return cellPrice;
};

//calculating the price of property according to his cost//
Monopoly.calculateProperyRent = function (propertyCost) {
    return propertyCost / 2;
};

//close pop up and launch another turn
Monopoly.closeAndNextTurn = function () {
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

//creating players if the user input is valid//
Monopoly.initPopups = function () {
    $(".popup-page#intro").find("button").click(function () {
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers", numOfPlayers)) {
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};

// adding or removing class and playing sound to link one property to one player after his buying
Monopoly.handleBuy = function (player, propertyCell, propertyCost) {
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost) {
        Monopoly.showErrorMsg();
        Monopoly.playSound("noMoney");
    } else {
        Monopoly.updatePlayersMoney(player, propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
            .addClass(player.attr("id"))
            .attr("data-owner", player.attr("id"))
            .attr("data-rent", rent);
        Monopoly.setNextPlayerTurn();
    }
};

//handle the flow of function action according to the cell the player stop into//
Monopoly.handleAction = function (player, action, amount) {
    switch (action) {
        case "move":
            Monopoly.movePlayer(player, amount);
            Monopoly.closePopup();
            break;
        case "pay":
            Monopoly.setNextPlayerTurn();
            Monopoly.updatePlayersMoney(player, amount);
            break;
        case "jail":
            Monopoly.sendToJail(player);
            Monopoly.closePopup();
            break;

    };

};

//create the common attribute at the beginning of a game to all players, according to the numbers of player decided by the user//
Monopoly.createPlayers = function (numOfPlayers) {
    var startCell = $(".go");
    for (var i = 1; i <= numOfPlayers; i++) {
        var player = $("<div />").addClass("player shadowed").attr("id", "player" + i).attr("title", "player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i == 1) {
            player.addClass("current-turn");
        }
        player.attr("data-money", Monopoly.moneyAtStart);
    }
};

//function to determine what is the cell next to the player, mandatory to make the player to move at every turn//
//checking if the player did a full turn//
Monopoly.getNextCell = function (cell) {
    var currentCellId = parseInt(cell.attr("id").replace("cell", ""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40) {
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};

//adding money to the player at each turn//
Monopoly.handlePassedGo = function () {
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player, - 20);
};

//checking the user input of number of player, in this case between 1 and 6//
Monopoly.isValidInput = function (validate, value) {
    var isValid = false;
    switch (validate) {
        case "numofplayers":
            if (value > 1 && value <= 6) {
                isValid = true;
            }
    }

    if (!isValid) {
        Monopoly.showErrorMsg();
    }
    return isValid;

}


Monopoly.showErrorMsg = function () {
    $(".popup-page .invalid-error").fadeTo(500, 1);
    setTimeout(function () {
        $(".popup-page .invalid-error").fadeTo(500, 0);
    }, 2000);
};


Monopoly.adjustBoardSize = function () {
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(), $(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) * 2;
    $(".board").css({ "height": boardSize, "width": boardSize });
}

Monopoly.closePopup = function () {
    $(".popup-lightbox").fadeOut();
};

Monopoly.playSound = function (sound) {
    var snd = new Audio("./sounds/" + sound + ".wav");
    snd.play();
}

Monopoly.showPopup = function (popupId) {
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

//launch the game//
Monopoly.init();