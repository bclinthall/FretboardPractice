/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function makeToggleControls() {
    var rowSel = "<tr>";
    var cellSel = "<td>";
    var catSel = "<table>"
        if (toggleControlsDiv && toggleControlsDiv.length > 0) {
            function addToggle(name, selector, catDiv) {
                var toggleDiv = $(rowSel).addClass("toggleDiv").appendTo(catDiv);
                $(cellSel).addClass("toggleTitle").text(name).appendTo(toggleDiv);
                var btnTd = $(cellSel).appendTo(toggleDiv);
                $("<button>").text("add").addClass("addBtn").attr("data-selector", selector).appendTo(btnTd);
                $("<button>").text("remove").addClass("removeBtn").attr("data-selector", selector).appendTo(btnTd);
            }
            var catDiv = $(catSel).addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            addToggle("all", "", catDiv);
            addToggle("naturals", "[data-accidental=false]", catDiv);
            addToggle("sharps and flats", "[data-accidental=true]", catDiv);

            var catDiv = $(catSel).addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            for (var i = 0; i < tuning.length; i++) {
                var stringName = (i + 1) + ": " + tuning[i];
                addToggle(stringName + " String", "[data-stringNum=" + (i + 1) + "]", catDiv);
            }
            var catDiv = $(catSel).addClass("toggleCatDiv").appendTo(toggleControlsDiv);
            for (var i = 0; i < noteNames.length; i++) {
                var noteName = noteNames[i];
                addToggle(noteName, "[data-shortNote=" + noteName + "]", catDiv);
            }
            var catDiv = $(catSel).addClass("toggleCatDiv").appendTo(toggleControlsDiv);
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