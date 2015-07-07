function Fretboard(fretboardDiv, toggleControlsDiv, gameControlsDiv) {
    var modeControlsDiv = $("#modeControls");
    var gameControlsDiv = gameControlsDiv ? $(gameControlsDiv) : $("#gameControls")

    var noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    var tuning = ["E2", "A2", "D3", "G3", "B3", "E4"]
    tuning.reverse();
    var gameType = "fromFret";
    var midi = [];
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < noteNames.length; j++) {
            midi.push(noteNames[j] + i);
        }
    }
    var game;
    function randInAry(ary) {
        return ary[Math.floor(Math.random() * ary.length)];
    }
    function getGameKey() {
        var obj = {
            gameType: gameType,
            tuning: tuning,
            available: getAvailable()
        }
        return JSON.stringify(obj);
    }
    function getHighScore() {
        var key = getGameKey();
        var highScore = localStorage.getItem(key);
        highScore = highScore || 0;
        return highScore;
    }
    function showHighScore() {
        $(".highScore").text(getHighScore());
    }

    function Game() {
        var available = getAvailable();
        if (available.length < 2) {
            alert("You must select more than one fret to play.")
            modeControls.setupMode();
            return;
        }
        var startTime = Date.now();
        var timerId;
        var timeRemaining = 10;
        var correctAnswer;
        var currentScore = 0;
        var positionId;
        function getTime() {
            return timeRemaining - Math.floor((Date.now() - startTime) / 1000);
        }
        function overlay(divs) {
            var overlays = $();
            divs.each(function(index, item) {
                item = $(item);
                var overlay = $("<div>")
                        .height(item.height())
                        .width(item.width())
                        .css({
                            position: "absolute",
                            left: 0,
                            top: 0,
                        })
                        .appendTo(item);
                overlays = overlays.add(overlay)
            })
            return overlays;
        }
        function correctAnswer(div) {

        }
        var time = 150;
        function showScore() {
            $(".currentScore").text(currentScore);
        }
        showHighScore();
        function registerIncorrect(div) {
            var divOverlay = overlay(div);
            divOverlay.hide();
            divOverlay.css({"background-color": "red", "border-radius": "5px"})
            divOverlay
                    .fadeIn({duration: time, queue: true})
                    .fadeOut({duration: time, queue: true})
                    .fadeIn({duration: time, queue: true})
                    .fadeOut({duration: time, queue: true, complete: function() {
                            divOverlay.remove();
                        }})
            currentScore--;
            showScore()
        }
        function registerCorrect(div) {
            var divOverlay = overlay(div);
            divOverlay.hide();
            divOverlay.css({"background-color": "green", "border-radius": "5px"})
            divOverlay
                    .fadeIn({duration: time, queue: true})
                    .fadeOut({duration: time, queue: true, complete: function() {
                            divOverlay.remove();
                            newQuestion();
                        }})
            currentScore++;
            showScore()
        }
        function registerGuess(guess) {
            var div = $(".questionDiv");
            //registerCorrect(div);
            //////////////=========================================================
            //return;
            if (guess === correctAnswer) {
                console.log(correctAnswer, guess);
                registerCorrect(div);
            } else {
                console.log(correctAnswer, guess);
                registerIncorrect(div);
            }
        }
        function scrollTo(div) {
            var div = div[0];
            var rect = div.getBoundingClientRect();
            var winWidth = $("#fretboard").width();
            console.log(div)
            if (rect.x < 0 || rect.x + rect.width > winWidth) {
                var scrollLeft = $("#fretboard").scrollLeft();
                $("#fretboard").animate({scrollLeft: scrollLeft + rect.x - 25},200);
            }
        }
        function newQuestion() {
            var newPos = randInAry(available);
            while (newPos === positionId) {
                newPos = randInAry(available);
            }
            positionId = newPos;
            var positionDiv = $("[data-id=" + positionId + "]");
            correctAnswer = positionDiv.attr("data-shortnote");
            $(".questionDiv").removeClass("questionDiv");
            positionDiv.addClass("questionDiv");
            scrollTo(positionDiv);
            console.log(positionDiv, positionDiv.offset());
        }
        newQuestion();
        function showTime() {
            var time = getTime();
            $("#time").text("Time Remaining: " + getTime());
            timerId = setTimeout(showTime, 20);
            if (time <= 0) {
                quit();
            }
        }
        showTime();
        function quit() {
            clearTimeout(timerId);
            var prevHighScore = getHighScore();
            $(".scoreMsg").text("");
            if (currentScore > prevHighScore) {
                var key = getGameKey();
                localStorage.setItem(key, currentScore);
                $(".scoreMsg").text("New High Score!!!");

            }
            game = null;
            $("#scoreDisplayOverlay").show();

        }
        return {registerGuess: registerGuess, quit: quit}

    }
        function makeFretboard(tuning) {
                fretboardDiv.empty();
        
                function makeFretLengthArray() {
                    var ary = [0];
                    function d(n) {
                        return Math.pow(.5, (n / 12));
                    }
                    function width(n, divisor) {
                        divisor = divisor ? divisor : 1;
                        return (d(n - 1) - d(n)) / divisor;
                    }
                    for (var i = 0; i < 18; i++) {
                        ary.push(width(i, 1 / 100))
                    }
                    ary.push(4);
                    return ary;
                }
                function makeString(fretboardDiv, tuning, fretLengths, i){
                    var stringNum = 0;
                    var startNote = 0;
                    var startIndex = 0;
                    if(i>0){
                        stringNum = i;
                        startNote = tuning[stringNum-1];
                        startIndex = midi.indexOf(startNote);
                    }
                    var string = $("<div>")
                            .addClass("string")
                            .css({"flex-grow": 1})
                            .appendTo(fretboardDiv);
                    if(stringNum !==0){
                        string.attr("data-string", stringNum + " " + startNote);
                    }
                    for (var j = 0; j < fretLengths.length; j++) {
                        makeNote(string, startIndex, fretLengths, stringNum, j);
                    }   
                }
                function makeNote(string, startIndex, fretLengths, stringNum, fret){
                                var note = $("<div>")
                                .addClass("note")
                                .css({"flex-grow": fretLengths[fret]})
                                .appendTo(string);
                        var noteNameDiv = $("<div>")
                                .addClass("noteName")
                                .text(fret)
                                .appendTo(note);
                        if(stringNum !== 0 && fret<19){
                            var i = stringNum - 1;
                            var noteName = midi[startIndex + fret];
                            var accidental = noteName.length === 3;
                            var octave = noteName[noteName.length - 1];
                            var shortNote = noteName.substr(0, noteName.length - 1);
                            note.attr({
                                "data-id": i + "_" + fret,
                                "data-fret": fret,
                                "data-ocatave": octave,
                                "data-shortNote": shortNote,
                                "data-noteName": noteName,
                                "data-accidental": accidental,
                                "data-stringNum": stringNum
                            });
                            noteNameDiv.text(noteName)
                            $("<div>").addClass("questionIdentifier").appendTo(note);
                        }
                        if(fret === 19){
                            noteNameDiv.text("");
                        }
                }
                var fretLengths = makeFretLengthArray();
                for (var i = 0; i < 7; i++) {
                    makeString(fretboardDiv, tuning, fretLengths, i);
                }
            }
    function makeFretboard2(tuning) {
        fretboardDiv.empty();
        var scaleLength = 50 * 30;

        function d(n) {
            if (n === 0) {
                return 0
            }
            return scaleLength - (scaleLength / Math.pow(2, (n / 12)));
        }
        function width(n, divisor) {
            divisor = divisor ? divisor : 1;
            if (n === 0)
                return 50 / divisor;
            return (d(n) - d(n - 1))/divisor;

        }
        var totWidth = 75;
        for (var fret = 0; fret < 18; fret++){
            totWidth += width(fret, 1);
        }
        var divisor = totWidth / 300;
        
        for (var i = 0; i < tuning.length; i++) {
            var startNote = tuning[i];
            var startIndex = midi.indexOf(startNote);
            var stringNum = (i + 1);
            var stringDiv = $("<div>").addClass("string").attr("data-string", stringNum + " " + startNote).appendTo(fretboardDiv);
            for (var fret = 0; fret < 18; fret++) {
                var noteName = midi[startIndex + fret];
                var accidental = noteName.length === 3;
                var octave = noteName[noteName.length - 1];
                var shortNote = noteName.substr(0, noteName.length - 1);
                var noteDiv = $("<div>")
                        .addClass("note")
                        .attr({
                            "data-id": i + "_" + fret,
                            "data-fret": fret,
                            "data-ocatave": octave,
                            "data-shortNote": shortNote,
                            "data-noteName": noteName,
                            "data-accidental": accidental,
                            "data-stringNum": stringNum
                        })              
                        //.width(width(fret, 1))
                        .css("flex", width(fret, 1) + " 0 0")
                        .appendTo(stringDiv);
                $("<div>")
                        .addClass("noteName")
                        .text(noteName)
                        .appendTo(noteDiv)
                $("<div>").addClass("questionIdentifier").appendTo(noteDiv);

            }
        }
        $(".note").addClass("available");
    }
    fretboardDiv.on("click", ".note.setup", function(e) {
        $(this).toggleClass("available");
        showHighScore();
    })
    makeFretboard(tuning);
    var modeControls = new function() {
        $("#scoreDisplayOverlay").click(function() {
            $("#scoreDisplayOverlay").hide();
            modeControls.setupMode();
        })
        function setupMode() {
            $(".currentScore").text("0");
            $(".currentScoreDisp").hide();
            $("#time").hide();
            showHighScore();
            fretboardDiv.find(".note").addClass("setup");
            gameControlsDiv.hide();
            toggleControlsDiv.show();
            $(".setupBtn").hide();
            $(".playBtn").show();
            $(".questionDiv").removeClass("questionDiv");
            $(".playing").removeClass("playing");
            if (game)
                game.quit();
        }
        function playMode() {
            fretboardDiv.find(".note").removeClass("setup");
            $(".currentScoreDisp").show();
            $("#time").show();

            toggleControlsDiv.hide();
            gameControlsDiv.show();
            $(".playBtn").hide();
            $(".setupBtn").show();
            $(".available").addClass("playing")
            console.log(getAvailable());
            game = new Game(getAvailable());
        }
        ;
        $("<button>").text("Quit").addClass("setupBtn").appendTo(modeControlsDiv).click(setupMode);
        $("<button>").text("Play").addClass("playBtn").appendTo(modeControlsDiv).click(playMode);

        setupMode();
        return {setupMode: setupMode, playMode: playMode};
    }
    function makeToggleControls() {
        if (toggleControlsDiv && toggleControlsDiv.length > 0) {
            function addToggle(name, selector, catDiv) {
                var toggleDiv = $("<tr>").addClass("toggleDiv").appendTo(catDiv);
                $("<td>").addClass("toggleTitle").text(name).appendTo(toggleDiv);
                var btnTd = $("<td>").appendTo(toggleDiv);
                $("<button>").text("add").addClass("addBtn").attr("data-selector", selector).appendTo(btnTd);
                $("<button>").text("remove").addClass("removeBtn").attr("data-selector", selector).appendTo(btnTd);
            }
            var catDiv = $("<table>").addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            addToggle("all", "", catDiv);
            addToggle("naturals", "[data-accidental=false]", catDiv);
            addToggle("sharps and flats", "[data-accidental=true]", catDiv);

            var catDiv = $("<table>").addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            for (var i = 0; i < tuning.length; i++) {
                var stringName = (i + 1) + ": " + tuning[i];
                addToggle(stringName + " String", "[data-stringNum=" + (i + 1) + "]", catDiv);
            }
            var catDiv = $("<table>").addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            for (var i = 0; i < noteNames.length; i++) {
                var noteName = noteNames[i];
                addToggle(noteName, "[data-shortNote=" + noteName + "]", catDiv);
            }
            var catDiv = $("<table>").addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            for (var i = 0; i < 18; i++) {
                addToggle("Fret " + i, "[data-fret=" + i + "]", catDiv);
            }
            toggleControlsDiv.on("click", ".addBtn", function() {
                var selector = $(this).attr("data-selector");
                fretboardDiv.find(".note" + selector).addClass("available");
                showHighScore();
            })
            toggleControlsDiv.on("click", ".removeBtn", function() {
                var selector = $(this).attr("data-selector");
                fretboardDiv.find(".note" + selector).removeClass("available");
                showHighScore();
            })
        }
    }
    makeToggleControls();
    function makeOtherControls() {
        if (toggleControlsDiv && toggleControlsDiv.length > 0) {
            function makeTuningDiv(catDiv, string) {
                var div = $("<div>").appendTo(catDiv);
                var label = $("<label>").text("String " + string).appendTo(div)
                $("<input>").attr("data-tuningforstring", string - 1).appendTo(label);
            }
            function fillTuningVals() {
                for (var i = 0; i < 6; i++) {
                    $("[data-tuningforstring=" + i + "]").val(tuning[i]);
                }
            }
            var catDiv = $("<div>").addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            var title = $("<div>").text("tuning").appendTo(catDiv);
            $("<button>").text("Standard").appendTo(title).click(function() {
                tuning = ["E2", "A2", "D3", "G3", "B3", "E4"];
                fillTuningVals();
                makeFretboard(tuning);
                fretboardDiv.find(".note").addClass("setup");
                $("[data-tuningforstring]").removeClass("error");
            })
            makeTuningDiv(catDiv, 1, "E2");
            makeTuningDiv(catDiv, 2, "A2");
            makeTuningDiv(catDiv, 3, "D3");
            makeTuningDiv(catDiv, 4, "G3");
            makeTuningDiv(catDiv, 5, "B3");
            makeTuningDiv(catDiv, 6, "E4");
            fillTuningVals()
            $("body").on("input", "[data-tuningforstring]", function() {
                var val = $(this).val();
                if (midi.indexOf(val) === -1) {
                    $(this).addClass("error");
                } else {
                    var strIndex = parseInt($(this).attr("data-tuningforstring"));
                    tuning[strIndex] = val;
                    makeFretboard(tuning);
                    fretboardDiv.find(".note").addClass("setup");
                    $(this).removeClass("error");
                }

            });
            var fretNumDiv = $("<div>").appendTo(catDiv);
            var fretNumLabel = $("<label>").text("Show Fret Numbers").appendTo(fretNumDiv);
            $("<input>").prop("checked", true).attr({type: "checkbox"}).appendTo(fretNumLabel).change(function() {
                if ($(this).prop("checked")) {
                    fretboardDiv.find(".note").removeClass("hideFretNums")
                } else {
                    fretboardDiv.find(".note").addClass("hideFretNums")
                }
            })
            var stringNumDiv = $("<div>").appendTo(catDiv);
            var stringNumLabel = $("<label>").text("Show String Identifiers").appendTo(stringNumDiv);
            $("<input>").prop("checked", true).attr({type: "checkbox"}).appendTo(stringNumLabel).change(function() {
                if ($(this).prop("checked")) {
                    fretboardDiv.find(".string").removeClass("hideStringIdentifiers")
                } else {
                    fretboardDiv.find(".string").addClass("hideStringIdentifiers")
                }
            })

        }
    }
    makeOtherControls();
    function makeGameControls() {
        if(gameControlsDiv.find("answerBtn").length() ===0){
            for (var i = 0; i < noteNames.length; i++) {
                var noteName = noteNames[i];
                $("<button>").text(noteName).addClass("answerBtn").attr("data-noteBtn", noteName).appendTo(gameControlsDiv);
            }
        }
        $("body").on("click", ".answerBtn", function() {
            var noteName = $(this).attr("data-noteBtn");
            if (game) {
                game.registerGuess(noteName, $(this));
            }
        })
        var mod = "";
        $("body").on("keydown", function(e) {
            if (e.which === 188) {
                mod = "b";
            } else if (e.which === 190) {
                mod = "#";
            } else {
                var char = String.fromCharCode(e.keyCode)
                if (game && "ABCDEFG".indexOf(char) > -1) {
                    game.registerGuess(char + mod);
                }

            }
        })
        $("body").on("keyup", function(e) {
            if (e.which === 188 || e.which === 190) {
                mod = "";
            }
        })
    }
    makeGameControls();


    function getAvailable() {
        var available = [];
        $(".available").each(function(index, item) {
            available.push($(item).attr("data-id"));
        })
        return available;
    }

}