/**
 * Repräsentation einer Klausur
 */



/**
 * 
 * @param {*} jsonObj 
 */
function Klausur(jsonObj) {
	this.aufgaben = new Object();
	this.minKennziffer = 1;
	this.maxKennziffer = 50;
	this.modul = "";
	this.kommentar = "";
	this.studiengang = "Diplom"; // "Diplom" oder "Bachelor"

	if (jsonObj) {
		let keys = Object.keys(jsonObj.aufgaben);
		for (let i = 0; i < keys.length; ++i) {
			let key = keys[i];
			let aufgabe = new Aufgabe(jsonObj.aufgaben[key]);
			this.aufgaben[key] = aufgabe;
		}

		this.minKennziffer = jsonObj.minKennziffer;
		this.maxKennziffer = jsonObj.maxKennziffer;
		this.mcSchrankeFixiert = jsonObj.mcSchrankeFixiert;
		this.modul = jsonObj.modul;
		this.kommentar = jsonObj.kommentar;
		if (jsonObj.studiengang) {
			this.studiengang = jsonObj.studiengang;
		}
	}

}

/**
 * Gibt Klausur incl. Aller Aufgaben als JSON-Objekt zurück
 */
Klausur.prototype.toJSONObj = function () {
	let aufgaben = new Object();
	let keys = Object.keys(this.aufgaben);
	for (let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		aufgaben[key] = this.aufgaben[key].toJSONObj();
	}

	return {
		"aufgaben": aufgaben,
		"minKennziffer": this.minKennziffer,
		"maxKennziffer": this.maxKennziffer,
		"mcSchrankeFixiert": this.mcSchrankeFixiert,
		"modul": this.modul,
		"kommentar": this.kommentar,
		"studiengang": this.studiengang
	}
}

/**
 * 
 */
Klausur.prototype.exportPunkteCSV = function () {
	let result = "";

	// Kopf der Tabelle
	result += "Kennziffer"
	for (let i = 1; i <= this.getAnzahlAufgaben(); ++i) {
		result += ";Aufgabe " + i;
	}

	for (let kennziffer = this.getMinKennziffer(); kennziffer <= this.getMaxKennziffer(); ++kennziffer) {
		result += "\n" + kennziffer + ";";
		for (let aufg = 1; aufg <= this.getAnzahlAufgaben(); ++aufg) {
			let aufgabe = this.getAufgabe(aufg);
			let punkte = aufgabe.getPunkte(kennziffer);
			result += punkte != null ? punkte.toString().replace(".", ",") + ";" : ";";
		}
	}

	return result;
}

/**
 * 
 */
Klausur.prototype.importPunkteCSV = function (csvstring) {
	let zeilen = csvstring.split("\n");

	for (let kennziffer = this.getMinKennziffer(); kennziffer <= this.getMaxKennziffer(); ++kennziffer) {
		if (kennziffer < zeilen.length) {
			let zeile = zeilen[kennziffer];
			let spalten = zeile.split(";");
			for (let aufg = 1; aufg <= this.getAnzahlAufgaben(); ++aufg) {
				if (aufg < spalten.length) {
					let aufgabe = this.getAufgabe(aufg);
					let punkte = spalten[aufg].trim();
					if (punkte.length > 0) {
						aufgabe.setPunkte(kennziffer, punkte);
					}
				}
			}
		}
	}
}

/**
 * 
 */
Klausur.prototype.exportAuswertungOrgaCSV = function () {
	let formatNumber = function (number) {
		if (isNaN(number) || number == null) {
			return "";
		}
		return number.toString().replace(".", ",");
	}

	let formatFixed = function (number, stellen) {
		if (isNaN(number) || number == null) {
			return "";
		}
		return number.toFixed(stellen).replace(".", ",");
	}

	let auswertung = this.getAuswertung();
	let result = "Kennziffer;Rangpunkte gesamt;Punkte Textaufgaben;Prozent Textaufgaben;Rangpunkte Textaufg.;Punkte MC;Prozent MC;Rangpunkte MC;;Max Punkte TXT;Max Punkte MC;Punktedurchschnitt MC;Mindestpunktzahl MC fest;Mindestpunktzahl MC dynamisch;Mindestpunktzahl MC angewendet;";

	for (let kennziffer = this.getMinKennziffer(); kennziffer <= this.getMaxKennziffer(); ++kennziffer) {
		let eintrag = auswertung.eintraege[kennziffer];
		result += "\n";
		result += kennziffer + ";";
		result += formatNumber(eintrag.rangpunkteGesamt) + ";";
		//result += formatNumber(eintrag.rangpunkteGanzzahl) + ";";
		//result += (eintrag.noteGesamt != null ? eintrag.noteGesamt.replace("ü","ue") : "") + ";";
		result += formatNumber(eintrag.punkteTXT) + ";";
		result += formatFixed(eintrag.prozentTXT, 3) + ";";
		result += formatNumber(eintrag.rangpunkteTXT) + ";";
		result += formatNumber(eintrag.punkteMC) + ";";
		result += formatFixed(eintrag.prozentMC, 3) + ";";
		result += formatNumber(eintrag.rangpunkteMC) + ";";
		result += ";";
		result += formatNumber(auswertung.erreichbarTXT) + ";";
		result += formatNumber(auswertung.erreichbarMC) + ";";
		result += formatFixed(auswertung.durchschnittMC, 3) + ";";
		result += formatFixed(auswertung.festeMindestpunktzahlMC, 3) + ";";
		result += formatFixed(auswertung.dynamischeMindestpunktzahlMC, 3) + ";";
		result += formatFixed(auswertung.mindestpunktzahlMC, 3) + ";";
	}

	return result;
}

/**
 * 
 */
Klausur.prototype.exportAuswertungBeiblattCSV = function () {
	let formatNumber = function (number) {
		if (isNaN(number) || number == null) {
			return "";
		}
		return number.toString().replace(".", ",");
	}

	let formatFixed = function (number, stellen) {
		if (isNaN(number) || number == null) {
			return "";
		}
		return number.toFixed(stellen).replace(".", ",");
	}

	let erreichbar = this.getErreichbarePunkte(true) + this.getErreichbarePunkte(false);
	let prozentPunkteMC = (this.getErreichbarePunkte(true) / erreichbar) * 100;
	let prozentPunkteTXT = 100 - prozentPunkteMC;

	let auswertung = this.getAuswertung();
	let result = "Modul;Kennziffer;Max-punkte-txt;Punkte-txt;Prozent-txt;Rangpunkte-txt;Klausuranteil-txt;max-punkte-mc;Punkte-mc;Prozent-mc;Rangpunkte-mc;angewendete_Grenze_MC;Klausuranteil_MC;Rangpunkte_Klausur;Bezeichnung_Aufgabe;Aufgabentyp;maximale-punkte;erreichte-punkte;letzter;";

	for (let kennziffer = this.getMinKennziffer(); kennziffer <= this.getMaxKennziffer(); ++kennziffer) {
		let eintrag = auswertung.eintraege[kennziffer];
		let aufgaben = eintrag.aufgaben;
		for (let i = 0; i < aufgaben.length; ++i) {
			let aufgabe = aufgaben[i];
			result += "\n";
			result += (this.getModul() + "").replace(/;/g, ",") + ";";
			result += kennziffer + ";";
			result += formatNumber(auswertung.erreichbarTXT) + ";";
			result += formatNumber(eintrag.punkteTXT) + ";";
			result += formatFixed(eintrag.prozentTXT, 3) + ";";
			result += formatNumber(eintrag.rangpunkteTXT) + ";";
			result += formatNumber(prozentPunkteTXT) + ";";
			result += formatNumber(auswertung.erreichbarMC) + ";";
			result += formatNumber(eintrag.punkteMC) + ";";
			result += formatFixed(eintrag.prozentMC, 3) + ";";
			result += formatNumber(eintrag.rangpunkteMC) + ";";
			result += formatFixed(auswertung.mindestpunktzahlMC, 3) + ";";
			result += formatNumber(prozentPunkteMC) + ";";
			result += formatNumber(eintrag.rangpunkteGesamt) + ";";
			result += (aufgabe.bezeichnung + "").replace(/;/g, ",") + ";";
			result += aufgabe.typ + ";";
			result += formatNumber(aufgabe.maxPunkte) + ";";
			result += formatNumber(aufgabe.punkte) + ";";
			result += ((i == aufgaben.length - 1) ? 1 : 0) + ";";
		}
	}

	return result;
}

/**
 * 
 */
Klausur.prototype.getAnzahlAufgaben = function () {
	return Object.keys(this.aufgaben).length;
}

/**
 * 
 */
Klausur.prototype.addAufgabe = function () {
	var id = this.getAnzahlAufgaben() + 1;

	this.aufgaben[id] = new Aufgabe();
}

/**
 * 
 */
Klausur.prototype.removeAufgabe = function (key) {
	delete this.aufgaben[key];
}

/**
 * 
 */
Klausur.prototype.getAufgabe = function (key) {
	return this.aufgaben[key];
}

/**
 * 
 */
Klausur.prototype.getAufgabenKeys = function () {
	var result = new Array();
	for (var i = 1; i <= this.getAnzahlAufgaben(); ++i) {
		result.push(i);
	}
	return result;
}

/**
 * 
 */
Klausur.prototype.getMinKennziffer = function () {
	return this.minKennziffer;
}

/**
 * 
 */
Klausur.prototype.getMaxKennziffer = function () {
	return this.maxKennziffer;
}

/**
 * 
 */
Klausur.prototype.setMaxKennziffer = function (maxKennziffer) {
	maxKennziffer = parseFloat(maxKennziffer);
	if (isNaN(maxKennziffer)) return;

	maxKennziffer |= 0;
	this.maxKennziffer = maxKennziffer;
	let keys = Object.keys(this.aufgaben);
	// iteriere durch alle Aufgaben und verwerfe alle Punkte
	// für Kennziffern, die größer als die maximale Kennziffer sind
	for (let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		let aufgabe = this.aufgaben[key];
		aufgabe.ensureMaxKennziffer(maxKennziffer);
	}

}

/** 
 * Suche alle Kennziffern, für die Punkte für MC/nicht-MC-Aufgaben eingetragen sind
 */
Klausur.prototype.getKennziffernMitPunkten = function (mc) {
	let result = new Array();

	// iteriere durch alle Kennziffern
	for (let kennz = this.minKennziffer; kennz <= this.maxKennziffer; ++kennz) {
		// iteriere durch alle Aufgaben
		let keys = Object.keys(this.aufgaben);
		for (let i = 0; i < keys.length; ++i) {
			let key = keys[i];
			let aufgabe = this.aufgaben[key];
			if (aufgabe.getIsMC() != mc) {
				continue;
			}

			let punkte = aufgabe.getPunkte(kennz);
			if (punkte != null) {
				result.push(kennz);
				break;
			}
		}
	}

	return result;
}

/**
 * 
 */
Klausur.prototype.getErreichbarePunkte = function (mc) {
	let summe = 0;
	let keys = Object.keys(this.aufgaben);
	for (let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		let aufgabe = this.aufgaben[key];
		if (aufgabe.getIsMC() == mc) {
			summe += aufgabe.getMaxPunkte();
		}
	}
	return summe;
}

/**
 * 
 */
Klausur.prototype.getPunkteDurchschnitt = function (mc) {
	let teilnehmer = this.getKennziffernMitPunkten(mc).length;
	let summe = 0;
	let keys = Object.keys(this.aufgaben);
	for (let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		let aufgabe = this.aufgaben[key];
		if (aufgabe.getIsMC() == mc) {
			summe += aufgabe.getPunkteSumme();
		}
	}
	return teilnehmer > 0 ? (summe / teilnehmer) : NaN;
}

Klausur.prototype.getPunkteFuerKennziffer = function (kennziffer, mc) {
	let summe = NaN;
	let keys = Object.keys(this.aufgaben);
	for (let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		let aufgabe = this.aufgaben[key];
		if (aufgabe.getIsMC() == mc) {
			let pkt = aufgabe.getPunkte(kennziffer);
			if (pkt != null) {
				if (isNaN(summe)) {
					summe = 0;
				}
				summe += pkt;
			}
		}
	}
	return summe;
}

Klausur.prototype.getTXTSchranke = function () {
	return this.getErreichbarePunkte(false) * 0.5;
}


Klausur.prototype.getMCSchrankeFest = function () {
	let erreichbar = this.getErreichbarePunkte(true);
	return erreichbar * 0.6;
}

Klausur.prototype.getMCSchrankeDynamisch = function () {
	let schranke = this.getPunkteDurchschnitt(true) * 0.78;
	
	// Für Bachelor: § 38 (4) GVIDVDV
	// [...] 78 Prozent der durchschnittlichen Punkte, mindestens jedoch 50 Prozent der erreichbaren Punkte
	if(this?.studiengang === "Bachelor") {
		let minSchranke = this.getErreichbarePunkte(true) * 0.5;
		if (schranke < minSchranke) {
			schranke = minSchranke;
		}
	}
	return schranke;
}

Klausur.prototype.setMCSchrankeFixiert = function (value) {
	schranke = parseFloat(value.replace(',', '.'));
	if (isNaN(schranke)) {
		delete (this.mcSchrankeFixiert);
	} else {
		let maxPunkteMC = this.getErreichbarePunkte(true);
		if (schranke < 0) schranke = 0;
		if (schranke > maxPunkteMC) schranke = maxPunkteMC;
		this.mcSchrankeFixiert = schranke;
	}
}

Klausur.prototype.getMCSchrankeFixiert = function () {
	if (this.mcSchrankeFixiert) {
		let schranke = this.mcSchrankeFixiert;
		if (!isNaN(schranke)) return this.mcSchrankeFixiert;
	}
	return null;
}

Klausur.prototype.getSchranke = function (mc) {
	if (mc) {
		// Schranke für Multiple-Choice
		let fest = this.getMCSchrankeFest();
		let dyn = this.getMCSchrankeDynamisch();
		let mcSchranke = (!isNaN(dyn) && dyn < fest) ? dyn : fest;
		if (this.getMCSchrankeFixiert()) {
			mcSchranke = this.getMCSchrankeFixiert();
		}
		return mcSchranke;
	} else {
		// Schranke für normale Aufgaben
		return this.getTXTSchranke();
	}
}


Klausur.prototype.getProzentFuerKennziffer = function (kennziffer, mc) {
	if (mc) {
		// Berechnung für Multiple-Choice
		let punkte = this.getPunkteFuerKennziffer(kennziffer, true);
		if (isNaN(punkte)) {
			return NaN;
		}

		let mindestpunktzahl = this.getSchranke(true);
		let erreichbar = this.getErreichbarePunkte(true);


		if (punkte >= mindestpunktzahl) {
			let ueberschreiten = punkte - mindestpunktzahl;
			let diff_schranke_max = erreichbar - mindestpunktzahl;
			return (ueberschreiten / diff_schranke_max) * 100;
		} else {
			return (1.0 - (punkte / mindestpunktzahl)) * -100;
		}
	} else {
		// Berechnung für Normalfall
		let punkte = this.getPunkteFuerKennziffer(kennziffer, false);
		let erreichbar = this.getErreichbarePunkte(false);
		if (isNaN(punkte) || isNaN(erreichbar)) {
			return NaN;
		}
		return (punkte / erreichbar) * 100;
	}
}

/*
 * Für Diplomstudiengang VIT
 */
Klausur.prototype.getRangpunkteFuerProzent = function (prozent, mc) {
	if (mc) {
		// Berechnung für Multiple-Choice
		if (isNaN(prozent)) return NaN;

		if (prozent >= 87.50) return 15;
		if (prozent >= 75.00) return 14;
		if (prozent >= 66.67) return 13;
		if (prozent >= 58.33) return 12;
		if (prozent >= 50.00) return 11;
		if (prozent >= 41.67) return 10;
		if (prozent >= 33.33) return 9;
		if (prozent >= 25.00) return 8;
		if (prozent >= 16.67) return 7;
		if (prozent >= 8.33) return 6;
		if (prozent >= 0.00) return 5;
		if (prozent >= -16.67) return 4;
		if (prozent >= -33.33) return 3;
		if (prozent >= -50.00) return 2;
		if (prozent >= -75.00) return 1;
		return 0;
	} else {
		// Berechnung für "normale" Aufgaben (aber was ist schon normal...)
		if (isNaN(prozent)) return NaN;

		if (prozent >= 93.70) return 15;
		if (prozent >= 87.50) return 14;
		if (prozent >= 83.40) return 13;
		if (prozent >= 79.20) return 12;
		if (prozent >= 75.00) return 11;
		if (prozent >= 70.90) return 10;
		if (prozent >= 66.70) return 9;
		if (prozent >= 62.50) return 8;
		if (prozent >= 58.40) return 7;
		if (prozent >= 54.20) return 6;
		if (prozent >= 50.00) return 5;
		if (prozent >= 41.70) return 4;
		if (prozent >= 33.40) return 3;
		if (prozent >= 25.00) return 2;
		if (prozent >= 12.50) return 1;
		return 0;
	}
}

/*
 * Für Bachelorstudiengang VIT
 */
Klausur.prototype.getNoteFuerProzent = function (prozent, mc) {
	if (isNaN(prozent)) return NaN;

	if (mc) {
		// Berechnung für Multiple-Choice, GVIDVDV § 38 (5)
		if (prozent >= 87.50) return 1.0;
		if (prozent >= 75.00) return 1.3;
		if (prozent >= 66.67) return 1.7;
		if (prozent >= 58.33) return 2.0;
		if (prozent >= 50.00) return 2.3;
		if (prozent >= 41.67) return 2.7;
		if (prozent >= 33.33) return 3.0;
		if (prozent >= 25.00) return 3.3;
		if (prozent >= 12.5) return 3.7;
		if (prozent >= 0.00) return 4.0;
		if (prozent >= -50.00) return 5.0;
		return 6.0;
	} else {
		// Berechnung für Textaufgaben, GVIDVDV § 37 (2)
		if (prozent >= 95) return 1.0;
		if (prozent >= 90) return 1.3;
		if (prozent >= 85) return 1.7;
		if (prozent >= 80) return 2.0;
		if (prozent >= 75) return 2.3;
		if (prozent >= 70) return 2.7;
		if (prozent >= 65) return 3.0;
		if (prozent >= 60) return 3.3
		if (prozent >= 55) return 3.7
		if (prozent >= 50) return 4.0
		if (prozent >= 25) return 5.0;
		return 6.0;
	}
}



Klausur.prototype.getNote = function (rangpunkte) {
	if (isNaN(rangpunkte)) return "";

	if (rangpunkte >= 14) return "sehr gut";
	if (rangpunkte >= 11) return "gut";
	if (rangpunkte >= 8) return "befriedigend";
	if (rangpunkte >= 5) return "ausreichend";
	if (rangpunkte >= 2) return "mangelhaft";
	return "ungenügend";
}

/*
 * Für Diplomstudiengang VIT
 */
Klausur.prototype.getRangpunkteGesamt = function (erreichbarTXT, erreichbarMC, rangpunkteTXT, rangpunkteMC) {
	if (isNaN(erreichbarTXT) || isNaN(erreichbarMC)) return NaN;
	if (isNaN(rangpunkteTXT) && !isNaN(rangpunkteMC)) return rangpunkteMC;
	if (!isNaN(rangpunkteTXT) && isNaN(rangpunkteMC)) return rangpunkteTXT;
	if (isNaN(rangpunkteTXT) && isNaN(rangpunkteMC)) return NaN;


	// wenn beide Rangpunktzahlen gleich sind, dann brauchen wir nicht rechnen
	if (rangpunkteTXT == rangpunkteMC) {
		return rangpunkteTXT;
	}

	// diese Form wurde gewählt für gute numerische Präzision
	var rangpunkte = ((rangpunkteTXT * erreichbarTXT) + (rangpunkteMC * erreichbarMC)) / (erreichbarTXT + erreichbarMC);

	// § 20 (6): Aus beiden Aufgabenteilen wird entsprechend ihrer Gewichtung die Rangpunktzahl der Klausur berechnet, und zwar auf zwei Dezimalstellen ohne Rundung.
	rangpunkte *= 100; // zwei Stellen nach links
	rangpunkte |= 0; // Umwandlung in Ganzzahl ohne Rundung
	rangpunkte /= 100; // zwei Stellen zurück

	return rangpunkte;
}

/*
 * Für Bachelorstudiengang VIT
 */
Klausur.prototype.getNoteGesamt = function (erreichbarTXT, erreichbarMC, noteTXT, noteMC) {
	if (isNaN(erreichbarTXT) || isNaN(erreichbarMC)) return NaN;
	if (isNaN(noteTXT) && !isNaN(noteMC)) return noteMC;
	if (!isNaN(noteTXT) && isNaN(noteMC)) return noteTXT;
	if (isNaN(noteTXT) && isNaN(noteMC)) return NaN;


	// wenn beide Noten gleich sind, dann brauchen wir nicht rechnen
	if (noteTXT == noteMC) {
		return noteTXT;
	}

	// diese Form wurde gewählt für gute numerische Präzision
	let note = ((noteTXT * erreichbarTXT) + (noteMC * erreichbarMC)) / (erreichbarTXT + erreichbarMC);

	// § 37 (6): Bei der Berechnung des gewichteten arithmetischen Mittels und des arithmetischen Mittels wird nur die erste Dezimalstelle hinter dem Komma ohne Rundung berücksichtigt.
	note *= 10; // eine Stelle nach links
	note |= 0; // Umwandlung in Ganzzahl ohne Rundung
	note /= 10; // eine Stelle zurück

	// Tabelle aus § 37 (6):
	function numerischeNote(note) {
		if (note >= 5.1) return 6.0;
		if (note >= 4.1) return 5.0;
		if (note >= 3.9) return 4.0;
		if (note >= 3.5) return 3.7;
		if (note >= 3.2) return 3.3;
		if (note >= 2.9) return 3.0;
		if (note >= 2.5) return 2.7;
		if (note >= 2.2) return 2.3;
		if (note >= 1.9) return 2.0;
		if (note >= 1.5) return 1.7;
		if (note >= 1.2) return 1.3;
		return 1.0;
	}
	note = numerischeNote(note);

	return note;
}

Klausur.prototype.getRangpunkteGanzzahl = function (rangpunkte) {
	let rpganz = rangpunkte;
	if (rpganz < 5.0) {
		// nicht bestanden, abrunden
		rpganz = Math.floor(rangpunkte);
	} else {
		// bestanden, kaufmännisch runden
		rpganz = Math.round(rangpunkte);
	}

	return rpganz;
}


Klausur.prototype.getAuswertung = function () {
	let erreichbarTXT = this.getErreichbarePunkte(false);
	let erreichbarMC = this.getErreichbarePunkte(true);


	let durchschnittMC = this.getPunkteDurchschnitt(true);
	let festeMindestpunktzahlMC = this.getMCSchrankeFest();
	let dynamischeMindestpunktzahlMC = this.getMCSchrankeDynamisch();
	let mindestpunktzahlMC = this.getSchranke(true);

	let eintraege = new Object();

	for (let i = this.getMinKennziffer(); i <= this.getMaxKennziffer(); i++) {
		let eintrag = new Object();
		eintrag.punkteMC = this.getPunkteFuerKennziffer(i, true);
		eintrag.prozentMC = this.getProzentFuerKennziffer(i, true);
		eintrag.rangpunkteMC = this.getRangpunkteFuerProzent(eintrag.prozentMC, true)

		eintrag.punkteTXT = this.getPunkteFuerKennziffer(i, false);
		eintrag.prozentTXT = this.getProzentFuerKennziffer(i, false);
		eintrag.rangpunkteTXT = this.getRangpunkteFuerProzent(eintrag.prozentTXT, false);

		eintrag.rangpunkteGesamt = this.getRangpunkteGesamt(erreichbarTXT, erreichbarMC, eintrag.rangpunkteTXT, eintrag.rangpunkteMC);
		eintrag.rangpunkteGanzzahl = this.getRangpunkteGanzzahl(eintrag.rangpunkteGesamt);
		eintrag.noteGesamt = this.getNote(eintrag.rangpunkteGanzzahl);

		// stelle Informationen zu den einzelnen Aufgaben zusammen
		let aufgaben = new Array();
		let aufgabenKeys = this.getAufgabenKeys();
		for (let j = 0; j < aufgabenKeys.length; ++j) {
			let key = aufgabenKeys[j];
			let aufgabe = klausur.getAufgabe(key);
			let aufgabeninfo = new Object();
			aufgabeninfo.bezeichnung = aufgabe.getBezeichnung();
			aufgabeninfo.typ = aufgabe.getIsMC() ? "MC" : "Text";
			aufgabeninfo.maxPunkte = aufgabe.getMaxPunkte();
			aufgabeninfo.punkte = aufgabe.getPunkte(i);
			aufgaben.push(aufgabeninfo);
		}
		eintrag.aufgaben = aufgaben;

		eintraege[i] = eintrag;
	}

	var result = {
		"minKennziffer": this.getMinKennziffer(),
		"maxKennziffer": this.getMaxKennziffer(),
		"erreichbarTXT": erreichbarTXT,
		"erreichbarMC": erreichbarMC,
		"durchschnittMC": durchschnittMC,
		"festeMindestpunktzahlMC": festeMindestpunktzahlMC,
		"dynamischeMindestpunktzahlMC": dynamischeMindestpunktzahlMC,
		"mindestpunktzahlMC": mindestpunktzahlMC,
		"eintraege": eintraege
	}
	return result;
}

Klausur.prototype.getModul = function () {
	return this.modul;
}

Klausur.prototype.setModul = function (modul) {
	this.modul = modul;
}

Klausur.prototype.getKommentar = function () {
	return this.kommentar;
}

Klausur.prototype.setKommentar = function (kommentar) {
	this.kommentar = kommentar;
}


