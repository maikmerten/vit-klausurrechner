/**
 * JavaScript
 */
 
// PWA register service worker
if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./js/sw.js');
    }

// Call init Funktion when loaded
window.addEventListener("load", init);

// Diese Klausur
var klausur;
var filename = "";
var idCounter = 0;


/** ------------------------------------------------------------
 * 
 * Initialisierung
 *    adds EventListener to Buttons
 *    generates Test with 1 task
 * 
 * ------------------------------------------------------------ */
function init() {
    // EventListener
    document.getElementById("bKlausur").addEventListener("click", showKlausur);
    document.getElementById("bPunkte").addEventListener("click", function(){showPunkte(false)});
    document.getElementById("bAuswertung").addEventListener("click", function(){showAuswertung(false)});
    document.getElementById("bStatistiken").addEventListener("click", showStatistics);

    // Diese Klausur
    klausur = new Klausur();

    ensureAufgabenAnzahl(1);

    // Speichern mit ctrl + s
    document.onkeydown = (e) => {
        if(e.code == "KeyS" && e.ctrlKey) {
            e.preventDefault();
            let focuselem = document.activeElement;
            let tmp = document.createElement("input");
            document.body.appendChild(tmp);
            tmp.focus();
            document.body.removeChild(tmp);
            if(focuselem) {
                focuselem.focus();
            }
            save();
        }
    }
}

/**
 * Liefert ein geleertes Container-Element zurück
 * @param {*} centered soll CSS-Klasse 'container' gesetzt werden
 * @return ein geleertes Container-Element
 */

function getEmptiedContainer(centered) {
    let container = document.getElementById("container");
    container.classList.remove("container");
    container.innerHTML = ""
    if(centered) {
        container.classList.add("container");
    }
    return container;
}

/** ------------------------------------------------------------
 * 
 * Erzeugt die Ansicht für die Klausur
 * 
 * ------------------------------------------------------------ */
function showKlausur() {
    // Navbar aktualisieren
    aktualisiereNavBar("bKlausur");

    // Klausurbuttons darstellen
    showButtonsKlausur();

    // Klausur anzeigen
    let container = getEmptiedContainer(true);

    // =====================================
    // Allgemeine Angaben KARTE
    // =====================================
    let form = document.createElement("form");
    cardAllg = getCard("Allgemeine Angaben zur Klausur", form);
    container.appendChild(cardAllg);


    // Allgeimeine Angaben ERSTE ZEILE
    // =====================================
    let zeile1 = document.createElement("div");
    zeile1.classList.add("form-row");
    form.appendChild(zeile1);

    // max Kennziffer
    let maxKennziffer = getTextfeld(
        "Höchste Kennziffer",
        klausur.getMaxKennziffer(),
        function () {
            let input = $(this);
            let value = input.prop("value");
            klausur.setMaxKennziffer(value);
            input.prop("value", klausur.getMaxKennziffer());
        }
    );
    zeile1.appendChild(maxKennziffer);

    // Anzahl Aufgaben
    let anzahlAufgaben = getTextfeld(
        "Anzahl Aufgaben",
        klausur.getAnzahlAufgaben(),
        function () {
            let input = $(this);
            let value = input.prop("value");
            ensureAufgabenAnzahl(value);
            input.prop("value", klausur.getMaxKennziffer());
        }
    );
    zeile1.appendChild(anzahlAufgaben);


    // Allgemeine Angaben ZWEITE ZEILE
    // =====================================
    let zeile2 = document.createElement("div");
    zeile2.classList.add("form-row");
    form.appendChild(zeile2);

    // Modul
    let modul = getTextfeld(
        "Modul",
        klausur.getModul(),
        function () {
            let input = $(this);
            let value = input.prop("value");
            klausur.setModul(value);
            input.prop("value", klausur.getModul());
        }
    );
    zeile2.appendChild(modul);

    // Studiengang
    let studiengang = getSelect(
        "Studiengang",
        ["Diplom", "Bachelor"],
        klausur?.studiengang,
        function () {
            let value = this.options[this.selectedIndex].value;
            klausur.setStudiengang(value);
        }
    );
    zeile2.appendChild(studiengang);


    // MC-Schranke fix
    let mc_schranke = getTextfeld(
        "Fixierte Schranke für MC",
        klausur.getMCSchrankeFixiert(),
        function () {
            let input = $(this);
            let value = input.prop("value");
            klausur.setMCSchrankeFixiert(value);
            value = klausur.getMCSchrankeFixiert();
            input.prop("value", value ? klausur.getMCSchrankeFixiert() : "");
        },
        "Die Punkteschranke für MC-Aufgaben wird i.d.R. automatisch berechnet. Hier nur etwas eintragen, wenn bewusst die Schranke festgelegt werden soll."
    );
    zeile2.appendChild(mc_schranke);

    // Allgeimeine Angaben DRITTE ZEILE
    // =====================================
    let zeile3 = document.createElement("div");
    zeile3.classList.add("form-row");
    form.appendChild(zeile3);

    // Kommentar
    let kommentar = getTextArea(
        "Kommentar",
        klausur.getKommentar(),
        function () {
            let textarea = $(this);
            let value = textarea.prop("value");
            klausur.setKommentar(value);
            textarea.prop("value", klausur.getKommentar());
        }
    );
    zeile3.appendChild(kommentar);


    // =====================================
    // Aufgaben KARTE
    // =====================================
    let aufgabenTabelle = document.createElement("table");
    aufgabenTabelle.classList.add("table", "table-sm", "table-hover");
    cardTab = getCard("Aufgaben", aufgabenTabelle);
    container.appendChild(cardTab);


    // =====================================
    // Aufgaben Tabelle
    // =====================================

    // Tabellenüberschrift
    let tabellenKopf = document.createElement("thead");
    aufgabenTabelle.appendChild(tabellenKopf);
    tabellenKopf.appendChild(getTabellenZeile(true, ["Nr.", "max. Punkte", "MC?", "Bezeichnung", "Kommentar"]));

    // Zeilen für die Aufgaben
    let tabellenRumpf = document.createElement("tbody");
    aufgabenTabelle.appendChild(tabellenRumpf);

    let aufgabenKeys = klausur.getAufgabenKeys();
    for (let i = 0; i < aufgabenKeys.length; ++i) {
        // Daten der einzelnen Zellen dieser Zeile
        let cells = [];

        let key = aufgabenKeys[i];
        let aufgabe = klausur.getAufgabe(key);

        // Nummer der Aufgabe
        cells.push(key);

        // max. Punkte
        let punkte = getInputFeld(
            aufgabe.getMaxPunkte(),
            2,
            aufgabe,
            function () {
                let input = $(this);
                let aufgabe = input.data("aufgabe");
                let value = input.val();
                aufgabe.setMaxPunkte(value);
                input.val(aufgabe.getMaxPunkte());
            }
        );
        cells.push(punkte);

        // multiple-choice?
        let mc = getCheckbox(
            aufgabe.getIsMC(),
            aufgabe,
            function () {
                let checkbox = $(this);
                let aufgabe = checkbox.data("aufgabe");
                let value = checkbox.prop("checked");
                aufgabe.setIsMC(value);
                checkbox.val(aufgabe.getIsMC());
            }
        );
        cells.push(mc);

        // Bezeichnung
        let bezeichnung = getInputFeld(
            aufgabe.getBezeichnung(),
            20,
            aufgabe,
            function () {
                let input = $(this);
                let aufgabe = input.data("aufgabe");
                let value = input.prop("value");
                aufgabe.setBezeichnung(value);
                input.prop("value", aufgabe.getBezeichnung());
            }
        );
        cells.push(bezeichnung);

        // Kommentar
        let kommentar = getInputFeld(
            aufgabe.getKommentar(),
            20,
            aufgabe,
            function () {
                let input = $(this);
                let aufgabe = input.data("aufgabe");
                let value = input.prop("value");
                aufgabe.setKommentar(value);
                input.prop("value", aufgabe.getKommentar());
            }
        );
        cells.push(kommentar);

        // Hinzufügen der Zeile zur Tabelle
        tabellenRumpf.appendChild(getTabellenZeile(false, cells));
    }
}




/** ------------------------------------------------------------
 * 
 * Erzeugt die Ansicht für die Punkteingabe
 * 
 * @param {*} colorize true, falls die Zellen farbig entsprechend der erreichten Punkte hinterlegt werden sollen
 * 
 * ------------------------------------------------------------ */
function showPunkte(colorize) {
    //Navbar aktualisieren
    aktualisiereNavBar("bPunkte");

    // Punktebuttons darstellen
    showButtonsPunkte(colorize);


    // Tabelle für Punkte darstellen
    let container = getEmptiedContainer(false);

    let punktTabelle = document.createElement("table");
    punktTabelle.classList.add("table", "table-sm", "table-hover", "punktetabelle");
    container.appendChild(punktTabelle);

    // Tabellenüberschrift
    let aufgabenKeys = klausur.getAufgabenKeys();
    let spalten = ["Kennziffer"];
    for (k of aufgabenKeys)
        spalten.push("A." + k);
    let tabellenKopf = document.createElement("thead");
    punktTabelle.appendChild(tabellenKopf);
    tabellenKopf.appendChild(getTabellenZeile(true, spalten));

    // Eine Zeile je Teilnehmer*in
    let tabellenRumpf = document.createElement("tbody");
    punktTabelle.appendChild(tabellenRumpf);

    for (let kennziffer = klausur.getMinKennziffer(); kennziffer <= klausur.getMaxKennziffer(); ++kennziffer) {
        let cells = [kennziffer]

        // Eine Spalte je Aufgabe
        for (let i = 0; i < klausur.getAufgabenKeys().length; ++i) {
            let key = aufgabenKeys[i];
            let aufgabe = klausur.getAufgabe(key);
            let punkte = aufgabe.getPunkte(kennziffer);
            let input = getInputFeld(
                punkte == null ? "" : punkte,
                5,
                aufgabe,
                function () {
                    let input = $(this);
                    let kennziffer = input.data("kennziffer");
                    let aufgabe = input.data("aufgabe");
                    let punkte = input.prop("value");
                    aufgabe.setPunkte(kennziffer, punkte);
                    punkte = aufgabe.getPunkte(kennziffer);
                    input.val(punkte == null ? "" : punkte);
                }
            );

            if (colorize) {
                let prozent = Math.round((punkte / aufgabe.getMaxPunkte()) * 10);
                input.classList.add("p" + prozent);
            }

            // Spezialitäten für input-Felder für Punkte
            input.setAttribute("title", "Aufgabe " + key + (aufgabe.getIsMC() ? " (Multiple-Choice)" : " (Textaufgabe)") + (aufgabe.getKommentar() ? ": " + aufgabe.getKommentar() : ""));
            $(input).data("kennziffer", kennziffer);
            $(input).data("aufgabeKey", key);
            input.addEventListener("focus", function () {
                let input = $(this);
                let kennziffer = input.data("kennziffer");
                let aufgabe = input.data("aufgabe");
                let key = input.data("aufgabeKey");
                let bezeichnung = aufgabe.getBezeichnung() ? " (" + aufgabe.getBezeichnung() + ") " : "";
                status("Kennziffer " + kennziffer + ", Aufgabe " + key + bezeichnung + (aufgabe.getIsMC() ? " (Multiple-Choice)" : " (Textaufgabe)"));
            });
            input.addEventListener("blur", function () {
                status("");
                document.getElementById("status").style.visibility = "hidden";
            });

            // input-Feld für diese Spalte zum "Sammler" hinzufügen
            cells.push(input);
        }
        tabellenRumpf.appendChild(getTabellenZeile(false, cells));
    }
}


/** ------------------------------------------------------------
 * 
 * Erzeugt die Ansicht der Auswertung mit Notenberechnung
 * 
 * @param {*} colorize true, falls die Zellen farbig entsprechend der erreichten Punkte hinterlegt werden sollen
 * 
 * ------------------------------------------------------------ */
function showAuswertung(colorize) {
    //Navbar aktualisieren
    aktualisiereNavBar("bAuswertung");

    // Auswertungbuttons darstellen
    showButtonsAuswertung(colorize);

    // Auswertung anzeigen
    let container = getEmptiedContainer(true);

    let auswertung = klausur.getAuswertung();

    let hasNoten = klausur?.studiengang === "Bachelor";


    // =====================================
    // Allgemeine Angaben KARTE
    // =====================================
    let auswertungAllgemein = document.createElement("table");
    auswertungAllgemein.classList.add("table", "table-sm", "table-hover");
    cardAllgemein = getCard("Allgemeine Auswertung", auswertungAllgemein);
    container.appendChild(cardAllgemein);

    // Tabellenüberschrift
    let kopfAllgmein = document.createElement("thead");
    auswertungAllgemein.appendChild(kopfAllgmein);
    let ueberschriftenAllg = [];
    ueberschriftenAllg.push("max. Punkte Textteil");
    ueberschriftenAllg.push("max. Punkte MC");
    ueberschriftenAllg.push("⌀ Punkte MC");
    ueberschriftenAllg.push("MC Schranke fest");
    ueberschriftenAllg.push("MC Schranke dynamisch");
    ueberschriftenAllg.push("MC Schranke angewendet");
    kopfAllgmein.appendChild(getTabellenZeile(true, ueberschriftenAllg));

    //Tabellendaten
    let rumpfAllgemein = document.createElement("tbody");
    auswertungAllgemein.appendChild(rumpfAllgemein);
    let dataAllg = [];
    dataAllg.push(getNumberOrEmpty(auswertung.erreichbarTXT));
    dataAllg.push(getNumberOrEmpty(auswertung.erreichbarMC));
    dataAllg.push(getNumberOrEmpty(auswertung.durchschnittMC.toFixed(3)));
    dataAllg.push(getNumberOrEmpty(auswertung.festeMindestpunktzahlMC.toFixed(3)));
    dataAllg.push(getNumberOrEmpty(auswertung.dynamischeMindestpunktzahlMC.toFixed(3)));
    dataAllg.push(getNumberOrEmpty(auswertung.mindestpunktzahlMC.toFixed(3)));

    rumpfAllgemein.appendChild(getTabellenZeile(false, dataAllg));

    /* TODO Titel für die Zellen
       --------------------
        tr.append(zelle(, "", "erreichbare Punkte bei Textaufgaben"));
        tr.append(zelle(, "", "erreichbare Punkte bei Multiple-Choice-Aufgaben"));
        tr.append(zelle(, "", "durchschnittlich erreichte Punkte bei Multiple-Choice-Aufgaben"));
        tr.append(zelle(, "", "feste Mindestpunktzahl bei Multiple-Choice-Aufgaben"));
        tr.append(zelle(, "", "dynamische Mindestpunktzahl bei Multiple-Choice-Aufgaben"));
        tr.append(zelle(, "", "angewendete Mindestpunktzahl bei Multiple-Choice-Aufgaben"));
    */


    // =====================================
    // Angaben je Kennziffer KARTE
    // =====================================
    let auswertungTabelle = document.createElement("table");
    auswertungTabelle.classList.add("table", "table-sm", "table-hover");
    cardTab = getCard("Auswertung je Kennziffer", auswertungTabelle);
    container.appendChild(cardTab);


    // Tabellenüberschrift
    let kopfTabelle = document.createElement("thead");
    auswertungTabelle.appendChild(kopfTabelle);
    let ueberschriftenTab = [];
    ueberschriftenTab.push("Kennz.");
    ueberschriftenTab.push(hasNoten ? "Note Gesamt" : "Rangp. Gesamt");
    ueberschriftenTab.push("Pkt. Textaufg.");
    ueberschriftenTab.push("% Textaufg.");
    ueberschriftenTab.push(hasNoten ? "Note Textaufg." : "Rangp. Textaufg.");
    ueberschriftenTab.push("Pkt. MC");
    ueberschriftenTab.push("% MC");
    ueberschriftenTab.push(hasNoten ? "Note MC" : "Rangp. MC");

    kopfTabelle.appendChild(getTabellenZeile(true, ueberschriftenTab));


    //Tabellendaten
    let rumpfTabelle = document.createElement("tbody");
    auswertungTabelle.appendChild(rumpfTabelle);

    for (let kennziffer = auswertung.minKennziffer; kennziffer <= auswertung.maxKennziffer; ++kennziffer) {
        let eintrag = auswertung.eintraege[kennziffer];

        let dataTabelle = [];
        dataTabelle.push(getNumberOrEmpty(kennziffer));
        dataTabelle.push(getNumberOrEmpty(eintrag.rangpunkteGesamt));
        dataTabelle.push(getNumberOrEmpty(eintrag.punkteTXT));
        dataTabelle.push(getNumberOrEmpty(eintrag.prozentTXT.toFixed(3)));
        dataTabelle.push(getNumberOrEmpty(eintrag.rangpunkteTXT));
        dataTabelle.push(getNumberOrEmpty(eintrag.punkteMC));
        dataTabelle.push(getNumberOrEmpty(eintrag.prozentMC.toFixed(3)));
        dataTabelle.push(getNumberOrEmpty(eintrag.rangpunkteMC));

        let zeile = getTabellenZeile(false, dataTabelle);
        if (colorize && eintrag.noteGesamt != null && eintrag.noteGesamt != "")
            zeile.classList.add("rp" + eintrag.rangpunkteGanzzahl);
        rumpfTabelle.appendChild(zeile);

        /* TODO Titel der Zellen
          -------------------
        tr.append(zelle(kennziffer, "", "Kennziffer"));
        tr.append(zelle(eintrag.rangpunkteGesamt, rpKlasse(eintrag.rangpunkteGesamt), "Rangpunkte gesamt"));
        tr.append(zelle(eintrag.punkteTXT, "", "Punkte Textaufgaben"));
        tr.append(zelle(eintrag.prozentTXT.toFixed(3), "", "Prozent Textaufgaben"));
        tr.append(zelle(eintrag.rangpunkteTXT, rpKlasse(eintrag.rangpunkteTXT), "Rangpunkte Textaufgaben"));
        tr.append(zelle(eintrag.punkteMC, "", "Punkte Multiple-Choice"));
        tr.append(zelle(eintrag.prozentMC.toFixed(3), "", "Prozent Multiple-Choice"));
        tr.append(zelle(eintrag.rangpunkteMC, rpKlasse(eintrag.rangpunkteMC), "Rangpunkte Multiple-Choice"));
        */
    }
}

/** ------------------------------------------------------------
 * 
 * Erzeugt die Ansicht für die Statistik mit Diagrammen zur Notenverteilung usw.
 * 
 * ------------------------------------------------------------ */
function showStatistics() {
    //Navbar aktualisieren
    aktualisiereNavBar("bStatistiken");

    //Buttons verstecken
    hideButtons();

    // FARBEN
    let nichtBestandenInnen = "rgba(122, 27, 41, 0.5)";
    let nichtBestandenAussen = "rgba(122, 27, 41, 0.8)";
    let bestandenInnen = "rgba(34, 107, 56, 0.5)";
    let bestandenAussen = "rgba(34, 107, 56, 0.8)";
    let hintergrund = "rgb(248,249,250)";

    let auswertung = klausur.getAuswertung();
    let reay, labels, key, innerColors, outerColors;

    // Auswertung anzeigen
    let container = getEmptiedContainer(true);

    // =====================================
    // Histogramm für Rangpunkte in Karte
    // =====================================
    function createRPHistogramm(container) {
        let divRangpunkte = document.createElement("div");
        divRangpunkte.classList.add("container");
        divRangpunkte.id = "rpHistogramm";
        let cardRangpunkte = getCard("Verteilung der Rangpunkte", divRangpunkte);
        container.appendChild(cardRangpunkte);

        // Daten sammeln
        let ray = new Array();
        labels = ["15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "0"];
        for (let i = 0; i <= 15; ++i)
            ray[i] = 0;
        let keys = Object.keys(auswertung.eintraege);
        for (let i = 0; i < keys.length; ++i) {
            let eintrag = auswertung.eintraege[keys[i]];
            let rp = eintrag.rangpunkteGanzzahl | 0;
            ray[15 - rp]++;
        }

        // Plotly.js Diagramm konfigurieren
        innerColors = [];
        outerColors = [];
        for (let rp of labels) {
            if ((1 * rp) < 5) {
                innerColors.push(nichtBestandenInnen);
                outerColors.push(nichtBestandenAussen);
            }
            else {
                innerColors.push(bestandenInnen);
                outerColors.push(bestandenAussen);
            }
        }
        let data = [
            {
                x: labels,
                y: ray,
                type: "bar",
                text: ray.map(String),
                textposition: 'auto',
                marker: {
                    color: innerColors,
                    line: {
                        color: outerColors,
                        width: 1.5
                    }
                }
            }
        ];
        let layout = {
            title: "Rangpunkte",
            paper_bgcolor: hintergrund,
            plot_bgcolor: hintergrund,
            showlegend: false,
            type: "category",
            xaxis: {
                title: 'Rangpunkte',
                autorange: "reversed"
            },
            yaxis: {
                title: 'Anzahl [ ]'
            }
        };
        Plotly.newPlot('rpHistogramm', data, layout);
    };
    if (klausur?.studiengang != "Bachelor") {
        createRPHistogramm(container);
    }

    // =====================================
    // Histogramm für Noten in Karte
    // =====================================
    let divNoten = document.createElement("div");
    divNoten.classList.add("container");
    divNoten.id = "notenHistogramm";
    cardNoten = getCard("Verteilung der Noten", divNoten);
    container.appendChild(cardNoten);

    // Daten sammeln
    ray = new Array();
    labels = ["sehr gut", "gut", "befriedigend", "ausreichend", "mangelhaft", "ungenügend"];
    let summe = 0;
    for (let i = 0; i < labels.length; ++i)
        ray[i] = 0;
    keys = Object.keys(auswertung.eintraege)
    for (let i = 0; i < keys.length; ++i) {
        let note = auswertung.eintraege[keys[i]].noteGesamt;
        if (labels.indexOf(note) >= 0) {
            ray[labels.indexOf(note)]++;
            summe++;
        }
    }

    // Plotly.js Diagramm konfigurieren
    innerColors = [];
    outerColors = [];
    for (let i = 1; i < 7; i++) {
        if (i > 4) {
            innerColors.push(nichtBestandenInnen);
            outerColors.push(nichtBestandenAussen);
        }
        else {
            innerColors.push(bestandenInnen);
            outerColors.push(bestandenAussen);
        }
    }
    data = [
        {
            x: labels,
            y: ray,
            type: "bar",
            text: ray.map(String),
            textposition: 'auto',
            marker: {
                color: innerColors,
                line: {
                    color: outerColors,
                    width: 1.5
                }
            }
        }
    ];
    layout = {
        title: "Noten",
        paper_bgcolor: hintergrund,
        plot_bgcolor: hintergrund,
        showlegend: false,
        xaxis: {
            title: 'Note'
        },
        yaxis: {
            title: 'Anzahl [ ]'
        }
    };
    Plotly.newPlot('notenHistogramm', data, layout);


    // =====================================
    // Box-Plot für Aufgaben
    // =====================================
    let divAufgaben = document.createElement("div");
    divAufgaben.classList.add("container");
    divAufgaben.id = "boxplotAufgaben";
    cardAufgaben = getCard("Statistik der Aufgaben", divAufgaben);
    container.appendChild(cardAufgaben);

    // Daten sammeln
    keys = klausur.getAufgabenKeys();
    let boxplotsProzent = new Array();
    for (let i = 0; i < keys.length; ++i) {
        let key = keys[i];
        let aufgabe = klausur.getAufgabe(key);
        let punkteArrayInProzent = new Array();		// Ein Array in dem die erreichten Punkte in Prozent der jeweiligen Aufgabe liegen
        let maxPunkte = aufgabe.getMaxPunkte(); 	// höchste erreichbare Punktzahl der jeweiligen Aufgabe
        for (let index = 1; index <= Object.keys(aufgabe.punkte).length; index++) {
            punkteArrayInProzent.push(Math.round(aufgabe.getPunkte(index) / maxPunkte * 100));
        };
        boxplotsProzent.push(punkteArrayInProzent);
    }

    // Plotly.js Diagramm konfigurieren
    data = new Array();
    for (let i = 0; i < boxplotsProzent.length; i++) {
        let trace = {
            y: boxplotsProzent[i],
            type: 'box',
            name: 'A. ' + (i + 1)
        };

        data.push(trace)
    };

    layout = {
        title: "Aufgaben",
        paper_bgcolor: hintergrund,
        plot_bgcolor: hintergrund,
        showlegend: false,
        xaxis: {
            title: 'Aufgabe'
        },
        yaxis: {
            title: 'Leistungspunkte [%]'
        }
    };
    Plotly.newPlot('boxplotAufgaben', data, layout, { responsive: true });
}

/** ------------------------------------------------------------
 * 
 * 
 * @param {*} anzahl 
 * 
 * ------------------------------------------------------------ */
function ensureAufgabenAnzahl(anzahl) {
    anzahl = parseFloat(anzahl);
    if (isNaN(anzahl)) return;
    anzahl |= 0;

    if (anzahl < 1) anzahl = 1;

    while (anzahl > klausur.getAnzahlAufgaben()) {
        klausur.addAufgabe();
    }

    while (anzahl < klausur.getAnzahlAufgaben()) {
        let letzteAufgabe = klausur.getAnzahlAufgaben();
        klausur.removeAufgabe(letzteAufgabe);
    }

    showKlausur();
}



/** ------------------------------------------------------------
 * 
 * Klausur in JSON-Datei speichern
 * 
 * ------------------------------------------------------------ */
function save() {
    $("#dialog-passwort-speichern1").dialog({
        modal: true,
        buttons: {
            "Speichern": function () {
                let pwd1 = $("#passwort-speichern1").val();
                let pwd2 = $("#passwort-speichern2").val();

                if (pwd1 != pwd2) {
                    alert("Passwörter sind unterschiedlich!");
                    return;
                }
                $(this).dialog("close");

                let saveobj = klausur.toJSONObj();

                if (pwd1) {
                    let encdata = sjcl.encrypt(pwd1, JSON.stringify(saveobj), { "ks": 256 });
                    saveobj = {
                        "encryption": "sjcl",
                        "encdata": encdata
                    }
                }

                let jsonstring = JSON.stringify(saveobj);


                //<a href="" id="savelink" download="klausur.json""></a>
                let link = document.createElement("a");
                link.setAttribute("download", getFileName(".json"));
                link.href = "data:text/json;charset=utf-8," + encodeURIComponent(jsonstring);
                link.click();

            },
            "Abbrechen": function () {
                $(this).dialog("close");
            }
        }
    });


    return false;
}


/** ------------------------------------------------------------
 * 
 * Klausur aus JSON-Datei laden
 * 
 * ------------------------------------------------------------ */
function load() {
    filename = filename.slice(0, -5);
    $(this).next().after().text(filename + ".json");

    //
    var files = document.getElementById("klausurdatei").files;
    if (files.length < 1) {
        return;
    }
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function (theFile) {
        return function (e) {
            var data = JSON.parse(e.target.result);

            if (data.encryption) {
                $("#dialog-passwort-laden").dialog({
                    modal: true,
                    buttons: {
                        "Laden": function () {
                            try {
                                let decrypted = sjcl.decrypt($("#passwort-laden").val(), data.encdata);
                                $(this).dialog("close");

                                data = JSON.parse(decrypted);
                                klausur = new Klausur(data);
                                showKlausur();
                            } catch (e) {
                                alert("Entschlüsselung schlug fehl. Passwort korrekt?");
                            }
                        },
                        "Abbrechen": function () {
                            $(this).dialog("close");
                        }
                    }
                });
            } else {
                klausur = new Klausur(data);
                showKlausur();
            }
        };
    })(files[0]);
    reader.readAsText(files[0], "UTF-8");
}

/** ------------------------------------------------------------
 * 
 * Punkte als CSV Datei exportieren
 * 
 * ------------------------------------------------------------ */
function exportPunkteCSV() {
    let a = document.createElement("a");
    a.setAttribute("download", getFileName("_punkte.csv"));
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(klausur.exportPunkteCSV());
    a.click();
}

/** ------------------------------------------------------------
 * 
 * Punkte aus CSV-Datei importieren
 * 
 * ------------------------------------------------------------ */
function importPunkteCSV() {
    var files = document.getElementById("importPunkteCSV").files;
    if (files.length < 1) {
        return;
    }
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function (theFile) {
        return function (e) {
            var string = e.target.result;
            klausur.importPunkteCSV(string);
            showPunkte();
        };
    })(files[0]);
    reader.readAsText(files[0], "UTF-8");

}

/** ------------------------------------------------------------
 * 
 * Auswertung für die Prüfungsorga als CVS exportieren
 * 
 * ------------------------------------------------------------ */
function exportAuswertungOrgaCSV() {
    let a = document.createElement("a");
    a.setAttribute("download", getFileName("_auswertung-orga.csv"));
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(klausur.exportAuswertungOrgaCSV());
    a.click();
}

/** ------------------------------------------------------------
 * 
 * Klausurbegleitblatt als CVS exportieren
 * 
 * ------------------------------------------------------------ */
function exportAuswertungBeiblattCSV() {
    let a = document.createElement("a");
    a.setAttribute("download", getFileName("_auswertung-beiblatt.csv"));
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(klausur.exportAuswertungBeiblattCSV());
    a.click();
}


/** ------------------------------------------------------------
 * 
 * Aktualisiert die Navigationsleiste so, dass der übergebene Tab aktiv
 * und alle anderen Tabs inaktiv sind
 * 
 * @param {*} aktiverTab ID des Tabs, der aktiv ist
 * 
 * ------------------------------------------------------------ */
function aktualisiereNavBar(aktiverTab) {
    let list = document.getElementById("tabs").childNodes;
    for (i in list) {
        if (list[i].nodeName != "LI")
            continue;

        if (list[i].id == aktiverTab)
            list[i].classList.add("active");
        else
            list[i].classList.remove("active");
    }
}

/** ------------------------------------------------------------
 *
 * Zeigt die passenden Buttons für den Tab Klausur
 * 
 * ------------------------------------------------------------ */
function showButtonsKlausur() {
    /*
    <form class="form-inline pr-3">
        <div class="custom-file">
            <input type="file" class="custom-file-input form-control-lg" id="files" >
            <label class="custom-file-label" for="files" data-browse="Klausur laden"></label>
        </div>
    </form>
    <button type="button" class="btn btn-light" id="bSave">Klausur speichern</button>
    */

    let ul = hideButtons();

    let form = document.createElement("form");
    form.classList.add("form-inline", "mr-3");
    ul.appendChild(form);

    let div = document.createElement("div");
    form.classList.add("custom-file");
    form.appendChild(div);

    let input = document.createElement("input");
    input.classList.add("custom-file-input", "form-control-lg");
    input.type = "file";
    input.id = "klausurdatei";
    input.title = "Klausur aus JSON laden";
    input.setAttribute("name", "files[]");
    input.addEventListener("change", load);
    div.appendChild(input);

    let label = document.createElement("label");
    label.classList.add("custom-file-label");
    label.setAttribute("for", "klausurdatei");
    label.setAttribute("data-browse", "Laden");
    label.title = "Klausur aus JSON laden";
    label.innerHTML = "JSON Datei auswählen";
    div.appendChild(label);

    let button = document.createElement("button");
    button.classList.add("btn", "btn-light", "mr-3");
    button.type = "button";
    button.id = "bSave";
    button.innerHTML = "Speichern";
    button.title = "Klausur als JSON speichern";
    button.addEventListener("click", save);
    ul.appendChild(button);
}


/** ------------------------------------------------------------
 *
 * Zeigt die passenden Buttons für den Tab Punkte
 * 
 * @param {*} colorize true, wenn checkbx gechecked ist
 * 
 * ------------------------------------------------------------ */
function showButtonsPunkte(colorize) {

    let ul = hideButtons();

    // Checkbox für Farbe
    // ==========================
    let checkDiv = document.createElement("div");
    checkDiv.classList.add("form-check", "form-check-inline");
    ul.appendChild(checkDiv);
    let checkInput = document.createElement("input");
    checkInput.classList.add("form-check-input");
    checkInput.type = "checkbox";
    checkInput.id = "colorize";
    checkInput.checked = colorize;
    checkInput.addEventListener(
        "change",
        function(){
        showPunkte(this.checked);
    });
    checkDiv.appendChild(checkInput);
    let checkLabel = document.createElement("label");
    checkLabel.classList.add("form-check-label", "text-light");
    checkLabel.setAttribute("for", "colorize");
    checkLabel.innerHTML = "Farbe";
    checkDiv.appendChild(checkLabel);

    // Dateiauswahl für Laden
    // ==========================
    let form = document.createElement("form");
    form.classList.add("form-inline", "mr-3");
    ul.appendChild(form);
    let div = document.createElement("div");
    form.classList.add("custom-file");
    form.appendChild(div);

    // <input type='file' id='importPunkteCSV' name='importPunkteCSV[]' onChange='importPunkteCSV();'/>
    let input = document.createElement("input");
    input.classList.add("custom-file-input", "form-control-lg");
    input.type = "file";
    input.id = "importPunkteCSV";
    input.name = "importPunkteCSV[]";
    input.title = "Punkte aus CSV laden";
    input.addEventListener("change", importPunkteCSV);
    div.appendChild(input);

    let label = document.createElement("label");
    label.classList.add("custom-file-label");
    label.setAttribute("for", "files");
    label.setAttribute("data-browse", "Laden");
    label.title = "Punkte aus CSV laden";
    label.innerHTML = "CSV Datei auswählen";
    div.appendChild(label);

    // Button zum Speichern
    // ==========================
    let buttonSave = document.createElement("button");
    buttonSave.classList.add("btn", "btn-light", "mr-3");
    buttonSave.type = "button";
    buttonSave.id = "exportPunkteCSV";
    buttonSave.innerHTML = "Speichern";
    buttonSave.title = "Punkte als CSV speichern";
    buttonSave.addEventListener("click", exportPunkteCSV);
    ul.appendChild(buttonSave);
}


/** ------------------------------------------------------------
 *
 * Zeigt die passenden Buttons für den Tab Auswertung
 * 
 * @param {*} colorize true, wenn checkbx gechecked ist
 * 
 * ------------------------------------------------------------ */
function showButtonsAuswertung(colorize) {
    let ul = hideButtons();

    // Checkbox für Farbe
    // ==========================
    let checkDiv = document.createElement("div");
    checkDiv.classList.add("form-check", "form-check-inline");
    ul.appendChild(checkDiv);
    let checkInput = document.createElement("input");
    checkInput.classList.add("form-check-input");
    checkInput.type = "checkbox";
    checkInput.id = "colorize";
    checkInput.checked = colorize;
    checkInput.addEventListener(
        "change",
        function(){
            showAuswertung(this.checked);
    });
    checkDiv.appendChild(checkInput);
    let checkLabel = document.createElement("label");
    checkLabel.classList.add("form-check-label", "text-light");
    checkLabel.setAttribute("for", "colorize");
    checkLabel.innerHTML = "Farbe";
    checkDiv.appendChild(checkLabel);


    let form = document.createElement("form");
    form.classList.add("form-inline", "mr-3");
    ul.appendChild(form);

    // Button zum Speichern
    // ==========================
    let button1 = document.createElement("button");
    button1.classList.add("btn", "btn-light", "mr-3");
    button1.type = "button";
    button1.id = "exportAuswertungOrgaCSV";
    button1.innerHTML = "Notenliste";
    button1.title = "Notenliste für Prüfungsorga speichern";
    button1.addEventListener("click", exportAuswertungOrgaCSV);
    ul.appendChild(button1);

    // Button zum Speichern
    // ==========================
    let button2 = document.createElement("button");
    button2.classList.add("btn", "btn-light", "mr-3");
    button2.type = "button";
    button2.id = "exportAuswertungBeiblattCSV";
    button2.innerHTML = "Klausurbegleitblätter";
    button2.title = "Auswertung für Klausurbegleitblätter speichern";
    button2.addEventListener("click", exportAuswertungBeiblattCSV);
    ul.appendChild(button2);
}


/** ------------------------------------------------------------
 *
 * Versteckt die Buttons oben rechts in der Navigationsleiste
 * 
 * ------------------------------------------------------------ */
function hideButtons() {
    let ul = document.getElementById("loadsave");
    ul.innerHTML = "";
    return ul;
}



/** ------------------------------------------------------------
 * 
 * Ändert den Inhalt des Status-Felds in der Mitte der Navigationsleiste
 * 
 * @param {*} msg 
 * 
 * ------------------------------------------------------------ */
function status(msg) {
    let status = document.getElementById("status");
    status.innerHTML = msg;
    status.style.visibility = "visible";
}








// ##########################################################################################
// ##########################################################################################
//
//                  H E L P E R  -  F U N C T I O N S
//
// ##########################################################################################
// ##########################################################################################



/** ------------------------------------------------------------
 *
 * Gibt eine Zahl oder eine leere Zeichenkette zurück
 * 
 * ------------------------------------------------------------ */
function getNumberOrEmpty(val) {
    return isNaN(val) ? "" : val;
}





/** ------------------------------------------------------------
 *
 * Gibt einen Dateinamen zurück.
 * Dieser besteht aus dem Dateinamen einer geladenen JSON-Datei oder einem generischen Namen,
 * der um einen aktuellen Zeitstempel und der gegeben Endung erweitert wird.
 * 
 * @param {*} postfix Postfix für den Dateinamen. Es beinhaltet auch die Dateiendung incl. Punkt als Trennzeichen
 * 
 * ------------------------------------------------------------ */
function getFileName(postfix) {
    let fn = filename;

    if (fn == "") {
        fn = "klausurergebnis";

        if (klausur.modul != null && klausur.modul != "") {
            let prefix = "";
            if (isNaN(klausur.modul))
                prefix = klausur.modul + "_";
            else
                prefix = "m" + ("0" + klausur.modul).slice(-2) + "_";

            fn = prefix + fn;
        }
    }


    let d = new Date();
    fn += "_";
    fn += d.getFullYear();
    fn += ("0" + (d.getMonth() + 1)).slice(-2);
    fn += ("0" + d.getDate()).slice(-2);
    fn += ("0" + d.getHours()).slice(-2);
    fn += ("0" + d.getMinutes()).slice(-2);

    if (postfix != null)
        fn += postfix;

    return fn.toLocaleLowerCase();
}


/** ------------------------------------------------------------
 * 
 * Erzeug ein neues Eingabefeld als Boostrap input-group für die Klausurübersicht
 * 
 * @param {} label Beschriftung
 * @param {*} inhalt Wert des Textfeldes
 * @param {*} eventListener Eventlistener für Ändern der Werte
 * 
 * ------------------------------------------------------------ */
function getTextfeld(label, inhalt, eventListener, hinweis) {

    /*
    <div class="form-group">
        <label for="exampleInputEmail1">Email address</label>
        <input type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter email">
        <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
     </div>
    */

    let divNode = document.createElement("div");
    divNode.classList.add("form-group", "col-md-6");

    let labelNode = document.createElement("label");
    labelNode.innerHTML = label;
    labelNode.setAttribute("for", "input" + idCounter);
    divNode.appendChild(labelNode);

    let inputNode = document.createElement("input");
    inputNode.classList.add("form-control");
    inputNode.setAttribute("id", "input" + idCounter++);
    inputNode.type = "text";
    inputNode.value = inhalt;
    inputNode.addEventListener("change", eventListener);
    divNode.appendChild(inputNode);

    if (hinweis != null) {
        let smallNode = document.createElement("small");
        smallNode.classList.add("form-text", "text-muted");
        smallNode.innerHTML = hinweis;
        divNode.appendChild(smallNode);
    }

    return divNode;
}


/** ------------------------------------------------------------
 * 
 * Erzeug ein neues Eingabefeld als Boostrap input-group für die Klausurübersicht
 * 
 * @param {} label Beschriftung
 * @param {*} inhalt Wert des Textfeldes
 * @param {*} eventListener Eventlistener für Ändern der Werte
 * 
 * ------------------------------------------------------------ */
function getTextArea(label, inhalt, eventListener) {

    /*
    <div class="form-group">
        <label for="exampleFormControlTextarea1">Example textarea</label>
        <textarea class="form-control" id="exampleFormControlTextarea1" rows="3"></textarea>
    </div>
    */

    let divNode = document.createElement("div");
    divNode.classList.add("form-group", "col-md-12");

    let labelNode = document.createElement("label");
    labelNode.innerHTML = label;
    let attr = document.createAttribute("for");
    attr.value = "textarea" + idCounter;
    labelNode.setAttributeNode(attr);
    divNode.appendChild(labelNode);

    let textarea = document.createElement("textarea");
    textarea.classList.add("form-control");
    textarea.id = "textarea" + idCounter++;
    textarea.innerHTML = inhalt;
    textarea.addEventListener("change", eventListener);
    divNode.appendChild(textarea);

    return divNode;
}


/** ------------------------------------------------------------
 * 
 * Gibt eine Karte mit dem gegebenen Titel zurück
 * 
 * @param {*} titel Der Titel als Text
 * @param {*} body Der Body als Element
 * 
 * ------------------------------------------------------------ */
function getCard(titel, body) {

    /*
    <div class="card">
        <div class="card-header">
            Featured
        </div>
        <div class="card-body">
            
        </div>
    </div>
*/

    let card = document.createElement("div");
    card.classList.add("card", "border-secondary", "mb-5");
    container.appendChild(card);

    let cardHeader = document.createElement("div");
    cardHeader.classList.add("card-header", "bg-secondary", "text-white");
    cardHeader.innerHTML = titel;
    card.appendChild(cardHeader);

    let cardBody = document.createElement("div");
    cardBody.classList.add("card-body");
    cardBody.appendChild(body);
    card.appendChild(cardBody);

    return card
}


/** ------------------------------------------------------------
 * 
 * Erzeugt eine Tabellenzeile <tr> der gegebenen Daten.
 * 
 * @param {} isHead true, falls es die Titelzeile ist
 * @param {*} data Array mit Daten der einzelnen Zellen
 * 
 * ------------------------------------------------------------ */
function getTabellenZeile(isHead, data) {
    let row = document.createElement("tr");

    let tag = "td";
    if (isHead)
        tag = "th";

    for (elem of data) {
        let cell = document.createElement(tag);
        if (elem instanceof Element)
            cell.appendChild(elem);
        else
            cell.innerHTML = elem;
        row.appendChild(cell);
    }

    return row;
}


/** ------------------------------------------------------------
 *
 * Erzeugt ein Text-<input> Feld mit gegebenem Inhalt und EventListener.
 * 
 * @param {*} inhalt Textinhalt des Feldes
 * @param {*} size Größe des Textfeldes
 * @param {*} data Datenobjekt, das mit dem Schlüssel "aufgabe" verknüpft wird
 * @param {*} eventListener Eventlistener onChange
 * 
 * ------------------------------------------------------------ */
function getInputFeld(inhalt, size, data, eventListener) {

    let input = document.createElement("input");
    input.type = "text";
    input.setAttribute("size", size);
    input.value = inhalt;
    $(input).data("aufgabe", data);
    input.addEventListener("change", eventListener);

    return input;
}


/** ------------------------------------------------------------
 *
 * Erzeugt eine Checkbox Feld mit gegebenem Inhalt und EventListener.
 * 
 * @param {*} isChecked true, falls die Checkbox gecheckt ist
 * @param {*} data Datenobjekt, das mit dem Schlüssel "aufgabe" verknüpft wird
 * @param {*} eventListener Eventlistener onChange
 * 
 * ------------------------------------------------------------ */
function getCheckbox(isChecked, data, eventListener) {

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isChecked;
    $(checkbox).data("aufgabe", data);
    checkbox.addEventListener("change", eventListener);

    return checkbox;
}

/** ------------------------------------------------------------
 *
 * Erzeugt ein <select> Feld mit Optionen und EventListener.
 * 
 * @param {*} label Label für das Select-Feld
 * @param {*} values Werte der Optionen
 * @param {*} eventListener Eventlistener onChange
 * 
 * ------------------------------------------------------------ */
function getSelect(label, values, value, eventListener) {
    let divNode = document.createElement("div");
    divNode.classList.add("form-group", "col-md-6");

    let labelNode = document.createElement("label");
    labelNode.innerHTML = label;
    let attr = document.createAttribute("for");
    attr.value = "select" + idCounter;
    labelNode.setAttributeNode(attr);
    divNode.appendChild(labelNode);

    let selectNode = document.createElement("select");
    selectNode.id = "select" + idCounter++;
    selectNode.classList.add("form-control");
    divNode.append(selectNode);
    for (let value of values) {
        let option = document.createElement("option");
        selectNode.append(option);
        option.innerText = value;
        option.setAttribute("value", value);
    }

    if (value) {
        selectNode.value = value;
    }

    selectNode.addEventListener("change", eventListener);
    return divNode;
}