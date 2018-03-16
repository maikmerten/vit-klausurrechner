function Klausur(jsonObj) {
	this.aufgaben = new Object();
	this.minKennziffer = 1;
	this.maxKennziffer = 50;
	this.kommentar = "";

	if(jsonObj) {
		let keys = Object.keys(jsonObj.aufgaben);
		for(let i = 0; i < keys.length; ++i) {
			let key = keys[i];
			let aufgabe = new Aufgabe(jsonObj.aufgaben[key]);
			this.aufgaben[key] = aufgabe;
		}

		this.minKennziffer = jsonObj.minKennziffer;
		this.maxKennziffer = jsonObj.maxKennziffer;
		this.kommentar = jsonObj.kommentar;
	}

}

Klausur.prototype.toJSONObj = function() {
	let aufgaben = new Object();
	let keys = Object.keys(this.aufgaben);
	for(let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		aufgaben[key] = this.aufgaben[key].toJSONObj();
	}

	return {
		"aufgaben": aufgaben,
		"minKennziffer": this.minKennziffer,
		"maxKennziffer": this.maxKennziffer,
		"kommentar": this.kommentar
	}
}


Klausur.prototype.exportPunkteCSV = function() {
	let result = "";

	// Kopf der Tabelle
	result += "Kennziffer"
	for(let i = 1; i <= this.getAnzahlAufgaben(); ++i) {
		result += ";Aufgabe " + i;
	}

	for(let kennziffer = this.getMinKennziffer(); kennziffer <= this.getMaxKennziffer(); ++kennziffer) {
		result += "\n" + kennziffer + ";";
		for(let aufg = 1; aufg <= this.getAnzahlAufgaben(); ++aufg) {
			let aufgabe = this.getAufgabe(aufg);
			let punkte = aufgabe.getPunkte(kennziffer);
			result += punkte != null ? punkte.toString().replace(".",",") + ";" : ";";
		}
	}	

	return result;
}


Klausur.prototype.importPunkteCSV = function(csvstring) {
	let zeilen = csvstring.split("\n");

	for(let kennziffer = this.getMinKennziffer(); kennziffer <= this.getMaxKennziffer(); ++kennziffer) {
		if(kennziffer < zeilen.length) {
			let zeile = zeilen[kennziffer];
			let spalten = zeile.split(";");
			for(let aufg = 1; aufg <= this.getAnzahlAufgaben(); ++aufg) {
				if(aufg < spalten.length) {
					let aufgabe = this.getAufgabe(aufg);
					let punkte = spalten[aufg].trim();
					if(punkte.length > 0) {
						aufgabe.setPunkte(kennziffer, punkte);
					}
				}
			}
		}
	}
}

Klausur.prototype.exportAuswertungCSV = function() {
	let formatNumber = function(number) {
		if(isNaN(number) || number == null) {
			return "";
		}
		return number.toString().replace(".",",");
	}

	let formatFixed = function(number, stellen) {
		if(isNaN(number) || number == null) {
			return "";
		}
		return number.toFixed(stellen).replace(".", ",");
	}

	let auswertung = this.getAuswertung();
	let result = "Kennziffer;Rangpunkte gesamt;Punkte Textaufgaben;Prozent Textaufgaben;Rangpunkte Textaufg.;Punkte MC;Prozent MC;Rangpunkte MC;;Max Punkte TXT;Max Punkte MC;Punktedurchschnitt MC;Mindestpunktzahl MC fest;Mindestpunktzahl MC dynamisch";

	for(let kennziffer = this.getMinKennziffer(); kennziffer <= this.getMaxKennziffer(); ++kennziffer) {
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
	}

	return result;
}


Klausur.prototype.getAnzahlAufgaben = function() {
	return Object.keys(this.aufgaben).length;
}

Klausur.prototype.addAufgabe = function() {
	var id = this.getAnzahlAufgaben() + 1;

	this.aufgaben[id] = new Aufgabe();
}

Klausur.prototype.removeAufgabe = function(key) {
	delete this.aufgaben[key];
}

Klausur.prototype.getAufgabe = function(key) {
	return this.aufgaben[key];
}

Klausur.prototype.getAufgabenKeys = function() {
	var result = new Array();
	for(var i = 1; i <= this.getAnzahlAufgaben(); ++i) {
		result.push(i);
	}
	return result;
}


Klausur.prototype.getMinKennziffer = function() {
	return this.minKennziffer;
}


Klausur.prototype.getMaxKennziffer = function() {
	return this.maxKennziffer;
}

Klausur.prototype.setMaxKennziffer = function(maxKennziffer) {
	maxKennziffer = parseFloat(maxKennziffer);
	if(isNaN(maxKennziffer)) return;

	maxKennziffer |= 0;
	this.maxKennziffer = maxKennziffer;
	let keys = Object.keys(this.aufgaben);
	// iteriere durch alle Aufgaben und verwerfe alle Punkte
	// für Kennziffern, die größer als die maximale Kennziffer sind
	for(let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		let aufgabe = this.aufgaben[key];
		aufgabe.ensureMaxKennziffer(maxKennziffer);
	}

}

	// Suche alle Kennziffern, für die Punkte für MC/nicht-MC-Aufgaben eingetragen sind
Klausur.prototype.getKennziffernMitPunkten = function(mc) {
	let result = new Array();
		
	// iteriere durch alle Kennziffern
	for(let kennz = this.minKennziffer; kennz <= this.maxKennziffer; ++kennz) {
		// iteriere durch alle Aufgaben
		let keys = Object.keys(this.aufgaben);
		for(let i = 0; i < keys.length; ++i) {
			let key = keys[i];
			let aufgabe = this.aufgaben[key];
			if(aufgabe.getIsMC() != mc) {
				continue;
			}

			let punkte = aufgabe.getPunkte(kennz);
			if(punkte != null) {
				result.push(kennz);
				break;
			}
		}
	}

	return result;
}

Klausur.prototype.getErreichbarePunkte = function(mc) {
	let summe = 0;
	let keys = Object.keys(this.aufgaben);
	for(let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		let aufgabe = this.aufgaben[key];
		if(aufgabe.getIsMC() == mc) {
			summe += aufgabe.getMaxPunkte();
		}
	}
	return summe;
}


Klausur.prototype.getPunkteDurchschnitt = function(mc) {
	let teilnehmer = this.getKennziffernMitPunkten(mc).length;
	let summe = 0;
	let keys = Object.keys(this.aufgaben);
	for(let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		let aufgabe = this.aufgaben[key];
		if(aufgabe.getIsMC() == mc) {
			summe += aufgabe.getPunkteSumme();
		}
	}
	return teilnehmer > 0 ? (summe / teilnehmer) : NaN;
}

Klausur.prototype.getPunkteFuerKennziffer = function(kennziffer, mc) {
	let summe = NaN;
	let keys = Object.keys(this.aufgaben);
	for(let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		let aufgabe = this.aufgaben[key];
		if(aufgabe.getIsMC() == mc) {
			let pkt = aufgabe.getPunkte(kennziffer);
			if(pkt != null) {
				if(isNaN(summe)) {
					summe = 0;
				}
				summe += pkt;
			}
		}
	}
	return summe;
}

Klausur.prototype.getTXTSchranke = function() {
	return this.getErreichbarePunkte(false) * 0.5;
}


Klausur.prototype.getMCSchrankeFest = function() {
	let erreichbar = this.getErreichbarePunkte(true);
	return erreichbar * 0.6;
}

Klausur.prototype.getMCSchrankeDynamisch = function() {
	return this.getPunkteDurchschnitt(true) * 0.78;
}

Klausur.prototype.getSchranke = function(mc) {
	if(mc) {
		// Schranke für Multiple-Choice
		let fest = this.getMCSchrankeFest();
		let dyn = this.getMCSchrankeDynamisch();
		return (!isNaN(dyn) && dyn < fest) ? dyn : fest;
	} else {
		// Schranke für normale Aufgaben
		return this.getTXTSchranke();
	}
}


Klausur.prototype.getProzentFuerKennziffer = function(kennziffer, mc) {
	if(mc) {
		// Berechnung für Multiple-Choice
		let punkte = this.getPunkteFuerKennziffer(kennziffer, true);
		if(isNaN(punkte)) {
			return NaN;
		}

		let mindestpunktzahl = this.getSchranke(true);
		let erreichbar = this.getErreichbarePunkte(true);


		if(punkte >= mindestpunktzahl) {
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
		if(isNaN(punkte) || isNaN(erreichbar)) {
			return NaN;
		}
		return (punkte / erreichbar) * 100;	
	}
}


Klausur.prototype.getRangpunkteFuerProzent = function(prozent, mc) {
	if(mc) {
		// Berechnung für Multiple-Choice
		if(isNaN(prozent)) return NaN;

		if(prozent >=  87.50) return 15;
		if(prozent >=  75.00) return 14;
		if(prozent >=  66.67) return 13;
		if(prozent >=  58.33) return 12;
		if(prozent >=  50.00) return 11;
		if(prozent >=  41.67) return 10;
		if(prozent >=  33.33) return 9;
		if(prozent >=  25.00) return 8;
		if(prozent >=  16.67) return 7;
		if(prozent >=   8.33) return 6;
		if(prozent >=   0.00) return 5;
		if(prozent >= -16.67) return 4;
		if(prozent >= -33.33) return 3;
		if(prozent >= -50.00) return 2;
		if(prozent >= -75.00) return 1;
		return 0;
	} else {
		// Berechnung für "normale" Aufgaben (aber was ist schon normal...)
		if(isNaN(prozent)) return NaN;

		if(prozent >= 93.70) return 15;
		if(prozent >= 87.50) return 14;
		if(prozent >= 83.40) return 13;
		if(prozent >= 79.20) return 12;
		if(prozent >= 75.00) return 11;
		if(prozent >= 70.90) return 10;
		if(prozent >= 66.70) return 9;
		if(prozent >= 62.50) return 8;
		if(prozent >= 58.40) return 7;
		if(prozent >= 54.20) return 6;
		if(prozent >= 50.00) return 5;
		if(prozent >= 41.70) return 4;
		if(prozent >= 33.40) return 3;
		if(prozent >= 25.00) return 2;
		if(prozent >= 12.50) return 1;
		return 0;
	}
}


Klausur.prototype.getNote = function(rangpunkte) {
	if(isNaN(rangpunkte)) return "";

	if(rangpunkte >= 14) return "sehr gut";
	if(rangpunkte >= 11) return "gut";
	if(rangpunkte >= 8) return "befriedigend";
	if(rangpunkte >= 5) return "ausreichend";
	if(rangpunkte >= 2) return "mangelhaft";
	return "ungenügend";
}


Klausur.prototype.getRangpunkteGesamt = function(erreichbarTXT, erreichbarMC, rangpunkteTXT, rangpunkteMC) {
	if(isNaN(erreichbarTXT) || isNaN(erreichbarMC)) return NaN;
	if(isNaN(rangpunkteTXT) && !isNaN(rangpunkteMC)) return rangpunkteMC;
	if(!isNaN(rangpunkteTXT) && isNaN(rangpunkteMC)) return rangpunkteTXT;
	if(isNaN(rangpunkteTXT) && isNaN(rangpunkteMC)) return NaN;


	// wenn beide Rangpunktzahlen gleich sind, dann brauchen wir nicht rechnen
	if(rangpunkteTXT == rangpunkteMC) {
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

Klausur.prototype.getRangpunkteGanzzahl = function(rangpunkte) {
	let rpganz = rangpunkte;
	if(rpganz < 5.0) {
		// nicht bestanden, abrunden
		rpganz = Math.floor(rangpunkte);
	} else {
		// bestanden, kaufmännisch runden
		rpganz = Math.round(rangpunkte);
	}

	return rpganz;
}


Klausur.prototype.getAuswertung = function() {
	let erreichbarTXT = this.getErreichbarePunkte(false);
	let erreichbarMC = this.getErreichbarePunkte(true);

		
	let durchschnittMC = this.getPunkteDurchschnitt(true);
	let festeMindestpunktzahlMC = this.getMCSchrankeFest();
	let dynamischeMindestpunktzahlMC = this.getMCSchrankeDynamisch();
	let mindestpunktzahlMC = this.getSchranke(true);

	let eintraege = new Object();

	for(let i = this.getMinKennziffer(); i <= this.getMaxKennziffer(); i++) {
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
		eintraege[i] = eintrag;
	}

	var result = {
		"minKennziffer" : this.getMinKennziffer(),
		"maxKennziffer" : this.getMaxKennziffer(),
		"erreichbarTXT" : erreichbarTXT,
		"erreichbarMC" : erreichbarMC,
		"durchschnittMC" : durchschnittMC,
		"festeMindestpunktzahlMC" : festeMindestpunktzahlMC,
		"dynamischeMindestpunktzahlMC" : dynamischeMindestpunktzahlMC,
		"mindestpunktzahlMC" : mindestpunktzahlMC,
		"eintraege" : eintraege
	}
	return result;
}

Klausur.prototype.getKommentar = function() {
	return this.kommentar;
}

Klausur.prototype.setKommentar = function(kommentar) {
	this.kommentar = kommentar;
}


