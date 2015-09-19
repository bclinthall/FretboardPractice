function Fretboard(fretboardDiv, toggleControlsDiv, gameControlsDiv) {
    var modeControlsDiv = $("#modeControls");
    var gameControlsDiv = gameControlsDiv ? $(gameControlsDiv) : $("#gameControls")
	var pitchListener;
	
    var noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    var tuning = ["E2", "A2", "D3", "G3", "B3", "E4"]
    tuning.reverse();
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
            gameType: $("input[name=gameType]:checked").val(),
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

    function Game(available) {
        if (available.length < 2) {
            modeControls.setupMode();
            alert("You must select more than one fret to play.")
            return;
        }
        var startTime = Date.now();
        var timerId;
        var timeRemaining = 30;
        var correctAnswer;
        var currentScore = 0;
        var positionId;
        var useGuitar = $(".overContainer").hasClass("useGuitar");
		if(useGuitar){
			var canvas = $(".listenerCanvas")[0];
			var ctx = canvas.getContext("2d");
			window.ctx = ctx;
			var w = canvas.width;
			var h = canvas.height;
			var onListen = function(result){
				if(result.score>1){
					ctx.fillStyle="#0F0";
				}else{
					ctx.fillStyle="#000";
				}
				ctx.clearRect(0,0,w,h);
				ctx.fillRect(0,h-(result.score*h) ,w, result.score*h);
				result.correctAnswer = correctAnswer;
				console.log(result)
				if(result.score>1 && correctAnswer === result.note){
					registerCorrect($(".questionDiv"));
				}	
			}
			var onErr = function(err){console.log(err)};
			pitchListener = new PitchListener(onListen, onErr, 5);
			pitchListener.startListening();
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
        var gotAnswer = false;
        function registerCorrect(div, log) {
			if(!gotAnswer){
				gotAnswer = true;
				console.log(log);
				var divOverlay = overlay(div);
				divOverlay.hide();
				divOverlay.css({"background-color": "green", "border-radius": "5px"});
				var count = divOverlay.length;
				divOverlay
						.fadeIn({duration: time, queue: true})
						.fadeOut({duration: time, queue: true, complete: function() {
								$(this).remove();
								if( -- count === 0 ){
									newQuestion();
									gotAnswer = false;
								}
							}})
				currentScore++;
				showScore()
			}
        }
        function registerGuess(guess) {
			var div = $(".questionDiv");
            if (guess === correctAnswer) {
                registerCorrect(div);
            } else {
                registerIncorrect(div);
            }
        }
        function scrollTo(div) {
            var div = div[0];
            var rect = div.getBoundingClientRect();
            var winWidth = $("body").width();
            var winHeight = $("body").height();
            if (rect.x < 0 || rect.x + rect.width > winWidth) {
                var scrollLeft = $(".fretboard").scrollLeft();
                $(".fretboard").animate({scrollLeft: scrollLeft + rect.x - 25}, 200);
            }
            if(rect.y < 0 || rect.y + rect.height > winHeight){
				var scrollTop = $(".fretboard").scrollTop();
				
				$(".fretboard").animate({scrollTop: scrollTop + rect.y - 25}, 200);
			}
        }
        function newQuestion() {
			if($(".overContainer").hasClass("fromFret")){
		
				var newPos = randInAry(available);
				while (newPos === positionId) {
					newPos = randInAry(available);
				}
				positionId = newPos;
				var positionDiv = $("[data-id=" + positionId + "]");
				correctAnswer = positionDiv.attr("data-shortnote");
				$(".note.questionDiv").removeClass("questionDiv");
				positionDiv.addClass("questionDiv");
				scrollTo(positionDiv);
			}else{
				var newNote = randInAry(available);
				while (newNote == correctAnswer) {
					newNote = randInAry(available);
				}
				correctAnswer = newNote;
				$(".toFretQuestion").text(newNote);
				if(pitchListener){
					pitchListener.listenFor(newNote);
				}
			}
        }
        newQuestion();
        function getTime() {
            return timeRemaining - Math.floor((Date.now() - startTime) / 1000);
        }
        var prevTime = false;
        function showTime() {
			var time = getTime();
            if(time!==prevTime){
				$("#time").text(time);
				prevTime = time;
			}
			timerId = setTimeout(showTime, 250);
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
            if(pitchListener) {
				pitchListener.stopListening();
				pitchListener = null;
			}

        }
        
        return {registerGuess: registerGuess, registerCorrect: registerCorrect, quit: quit};

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
        function makeString(fretboardDiv, tuning, fretLengths, i) {
            var stringNum = 0;
            var startNote = 0;
            var startIndex = 0;
            if (i > 0) {
                stringNum = i;
                startNote = tuning[stringNum - 1];
                startIndex = midi.indexOf(startNote);
            }
            var string = $("<div>")
                    .addClass("string")
                    .appendTo(fretboardDiv);
            if (stringNum !== 0) {
                string.attr("data-string", stringNum + " " + startNote);
            }
            for (var j = 0; j < fretLengths.length; j++) {
                makeNote(string, startIndex, fretLengths, stringNum, j);
            }
        }
        function makeNote(string, startIndex, fretLengths, stringNum, fret) {
            var note = $("<div>")
                    .addClass("note")
                    .css({"flex-grow": fretLengths[fret]})
                    .appendTo(string);
            var noteNameDiv = $("<div>")
                    .addClass("noteName")
                    .text(fret)
                    .appendTo(note);
            if (stringNum !== 0 && fret < 19) {
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
            if (fret === 19) {
                noteNameDiv.text("");
            }
        }
        var fretLengths = makeFretLengthArray();
        for (var i = 0; i < 7; i++) {
            makeString(fretboardDiv, tuning, fretLengths, i);
        }
    }
/*    function makeFretboard2(tuning) {
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
            return (d(n) - d(n - 1)) / divisor;

        }
        var totWidth = 75;
        for (var fret = 0; fret < 18; fret++) {
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
    }*/
    $("body").on("click", ".setupMode .note", function(e) {
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
			$(".overContainer").removeClass("playMode").addClass("setupMode");
			$(".currentScore").text("0");
            $("#time").hide();
            showHighScore();
            $(".note.questionDiv").removeClass("questionDiv");
            if (game)
                game.quit();
        }
        function playMode() {
			$(".overContainer").addClass("playMode").removeClass("setupMode");
			$("#time").show();
			game = new Game(getAvailable());
        }
        ;
        $("<button>").text("Quit").addClass("setupBtn").appendTo(modeControlsDiv).click(setupMode);
        $("<button>").text("Play").addClass("playBtn").appendTo(modeControlsDiv).click(playMode);

        setupMode();
        return {setupMode: setupMode, playMode: playMode};
    }
    function makeControlCatDiv(header, cssClass, parent) {
        var container = $("<li>").appendTo(parent).addClass(cssClass);
        $("<h1>").text(header).appendTo(container);
        return $("<ul>").appendTo(container);
    }
    function makeToggleControls() {
        $("body").on("click", "#toggleControls h1", function(){
            $(this).toggleClass("expanded");
        })
        var rowSel = "<li>";
        var cellSel = "<span>";
        if (toggleControlsDiv && toggleControlsDiv.length > 0) {
            if (!toggleControlsDiv.is("ul")) {
                toggleControlsDiv = $("<ul>").appendTo(toggleControlsDiv);
            }
            function addToggle(name, selector, catDiv) {
                var toggleDiv = $(rowSel).addClass("toggleDiv").appendTo(catDiv);
                $(cellSel).addClass("toggleTitle").html(name).appendTo(toggleDiv);
                var btnTd = $(cellSel).appendTo(toggleDiv);
                $("<button>").text("+").addClass("addBtn").attr("data-selector", selector).appendTo(btnTd);
                $("<button>").text("-").addClass("removeBtn").attr("data-selector", selector).appendTo(btnTd);
            }
			$("<div>").text("Select the finger positions you wish to practice by clicking the fretboard or using the controls below. Choose the game to play using the controls at the top.  Then tap \"Play\"").appendTo(toggleControlsDiv);
            var catDiv = makeControlCatDiv("General", "toggleCatDiv", toggleControlsDiv);
//                    $(catSel).addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            addToggle("all", "[data-fret]", catDiv);
            addToggle("naturals", "[data-accidental=false]", catDiv);
            addToggle("sharps and flats", "[data-accidental=true]", catDiv);

            catDiv = makeControlCatDiv("String", "toggleCatDiv", toggleControlsDiv);//$(catSel).addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            for (var i = 0; i < tuning.length; i++) {
                var stringName = (i + 1) + ": <span data-toggleForString='" + (i+1) + "'>" + tuning[i] + "</span>";
                addToggle(stringName + " String", "[data-stringNum=" + (i + 1) + "]", catDiv);
            }
            catDiv = makeControlCatDiv("Notes", "toggleCatDiv", toggleControlsDiv);//$(catSel).addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            for (var i = 0; i < noteNames.length; i++) {
                var noteName = noteNames[i];
                addToggle(noteName, "[data-shortNote=" + noteName + "]", catDiv);
            }
            catDiv = makeControlCatDiv("Frets", "toggleCatDiv", toggleControlsDiv);//$(catSel).addClass("toggleCatDiv").appendTo(toggleControlsDiv);
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
                var div = $("<li>").appendTo(catDiv);
                var label = $("<label>").html("<span class='toggleTitle'>String " + string+"</span>").appendTo(div)
                $("<input>").attr("data-tuningforstring", string - 1).appendTo(label);
            }
            function fillTuningVals() {
                for (var i = 0; i < 6; i++) {
                    $("[data-tuningforstring=" + i + "]").val(tuning[i]);
                    $("[data-toggleforstring=" + (i+1) + "]").text(tuning[i]);
                }
            }
            var catDiv = makeControlCatDiv("Tuning", "toggleCatDiv tuningDiv", toggleControlsDiv);//$("<div>").addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            //var title = $("<div>").text("tuning").appendTo(catDiv);
            $("<button>").text("Standard").appendTo(catDiv.parent().children().first()).click(function(e) {
                e.stopPropagation();
                tuning = ["E2", "A2", "D3", "G3", "B3", "E4"].reverse();
                fillTuningVals();
                makeFretboard(tuning);
                $("[data-tuningforstring]").removeClass("error");
            })
            makeTuningDiv(catDiv, 1);
            makeTuningDiv(catDiv, 2);
            makeTuningDiv(catDiv, 3);
            makeTuningDiv(catDiv, 4);
            makeTuningDiv(catDiv, 5);
            makeTuningDiv(catDiv, 6);
            fillTuningVals()
            $("body").on("input", "[data-tuningforstring]", function() {
                var val = $(this).val();
                if (midi.indexOf(val) === -1) {
                    $(this).addClass("error");
                } else {
                    var strIndex = parseInt($(this).attr("data-tuningforstring"));
                    tuning[strIndex] = val;
                    makeFretboard(tuning);
                    $(this).removeClass("error");
                    fillTuningVals();
                }

            });
            catDiv = makeControlCatDiv("Display", "toggleCatDiv", toggleControlsDiv);//$("<div>").addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            var fretNumDiv = $("<div>").appendTo(catDiv);
            var fretNumLabel = $("<label>").html("<span class='toggleTitle'>Show Fret Numbers</span>").appendTo(fretNumDiv);
            $("<input>").prop("checked", true).attr({type: "checkbox"}).appendTo(fretNumLabel).change(function() {
                if ($(this).prop("checked")) {
                    fretboardDiv.find(".note").removeClass("hideFretNums")
                } else {
                    fretboardDiv.find(".note").addClass("hideFretNums")
                }
            })
        }
    }
    makeOtherControls();
    function makeGameControls() {
        if (gameControlsDiv && gameControlsDiv.find(".answerBtn").length === 0) {
            for (var i = 0; i < noteNames.length; i++) {
                var noteName = noteNames[i];
                $("<button>").text(noteName).addClass("answerBtn").attr("data-noteBtn", noteName).appendTo(gameControlsDiv);
            }
        }
        $("body").on("mouseup", ".fromFret.playMode .answerBtn", function() {
            var noteName = $(this).attr("data-noteBtn");
            if (game) {
                game.registerGuess(noteName);
            }
        })
        $("body").on("mouseup", ".toFret.playMode .note.available", function(event) {
			
			event.stopPropagation();
            var noteName = $(this).attr("data-notename");
            $(".note.questionDiv").removeClass("questionDiv");
            $(this).addClass("questionDiv");
            if (game) {
                game.registerGuess(noteName);
            }
        })
        var mod = "";
        $("body").on("keydown", function(e) {
			if($(".overContainer").is(".playMode.fromFret")){
				if (e.which === 188) {
					mod = "b";
				} else if (e.which === 190) {
					mod = "#";
				} else {
					var char = String.fromCharCode(e.keyCode)
					if (game && "ABCDEFG".indexOf(char) > -1 && $(".overContainer").hasClass("playMode") &&   $(".overContainer").hasClass("fromFret")) {
						game.registerGuess(char + mod);
					}

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
	function makeListenerControls(){
		$(".useGuitar input[type=checkbox]").change(function(){
			var useGuitar = $(this).prop("checked");
			if(useGuitar){
				$(".overContainer").addClass("useGuitar");
			}else{
				$(".overContainer").removeClass("useGuitar");
			}
		})
	}
	makeListenerControls();

    function getAvailable() {
        var available = [];
        if($(".overContainer").hasClass("fromFret")){
			$(".available").each(function(index, item) {
				available.push($(item).attr("data-id"));
			})
		}else{
			$(".available").each(function(index, item) {
				var note = $(item).attr("data-noteName");
				if(available.indexOf(note === -1)){
					available.push(note);
				}
				/*
				var shortNote = $(item).attr("data-shortnote");
				if(available.indexOf(shortNote === -1)){
					available.push(shortNote);
				}*/
			})
		}
        return available;
    }

}
