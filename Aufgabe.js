function Aufgabe(jsonObj) {
	this.isMC = false;
	this.maxPunkte = 0;
	this.punkte = new Object();
	this.kommentar = "";

	// if an object is given: copy over stuff!
	if(jsonObj) {
		this.isMC = jsonObj.isMC;
		this.maxPunkte = jsonObj.maxPunkte;
		this.punkte = jsonObj.punkte;
		this.kommentar = jsonObj.kommentar;
	}

}

Aufgabe.prototype.toJSONObj = function() {
	return {
		"isMC": this.isMC,
		"maxPunkte": this.maxPunkte,
		"punkte": this.punkte,
		"kommentar": this.kommentar
	}
}


Aufgabe.prototype.setIsMC = function(mc) {
	this.isMC = mc;
}

Aufgabe.prototype.getIsMC = function() {
		return this.isMC;
}


Aufgabe.prototype.setMaxPunkte = function(maxPunkte) {
	maxPunkte = parseFloat(maxPunkte.replace(',', '.'));

	if(isNaN(maxPunkte) || maxPunkte < 0) {
		maxPunkte = 0;
	}

	this.maxPunkte = maxPunkte;
	this.ensureMaxPunkte();
}

Aufgabe.prototype.getMaxPunkte = function() {
	return this.maxPunkte;
}

Aufgabe.prototype.setPunkte = function(teilnehmer, punkteNeu) {
	punkteNeu = parseFloat(punkteNeu.replace(',', '.'));

	
	if(isNaN(punkteNeu)) {
		console.log("entferne Punkte für Kennziffer " + teilnehmer);
		delete this.punkte[teilnehmer];
	} else {
		punkteNeu = punkteNeu < 0 ? 0 : punkteNeu;
		punkteNeu = punkteNeu > this.getMaxPunkte() ? this.getMaxPunkte() : punkteNeu; 
		this.punkte[teilnehmer] = punkteNeu;
	}
}

Aufgabe.prototype.getPunkte = function(teilnehmer) {
	return this.punkte[teilnehmer];
}

Aufgabe.prototype.getPunkteSumme = function() {
	let summe = 0;
	let keys = Object.keys(this.punkte);
	for(let i = 0; i < keys.length; ++i) {
		let key = keys[i];
		let pkt = this.getPunkte(key);
		summe += pkt == null ? 0 : pkt;
	}
	return summe;
}

Aufgabe.prototype.getPunkteDurchschnitt = function() {
	let summe = this.getPunkteSumme();
	return summe / Object.keys(this.punkte).length;
}

Aufgabe.prototype.ensureMaxPunkte = function() {
	let kennziffern = Object.keys(this.punkte);
	for(let i = 0; i < kennziffern.length; ++i) {
		let kennziffer = kennziffern[i];
		let pkt = this.punkte[kennziffer];
		pkt = pkt > this.getMaxPunkte() ? this.getMaxPunkte() : pkt;
		this.punkte[kennziffer] = pkt;
	}	
}


Aufgabe.prototype.ensureMaxKennziffer = function(maxKennziffer) {
	let kennziffern = Object.keys(this.punkte);
	for(let i = 0; i < kennziffern.length; ++i) {
		let kennziffer = kennziffern[i];
		if(kennziffer > maxKennziffer) {
			delete this.punkte[kennziffer];
		}
	}
}


Aufgabe.prototype.getKommentar = function() {
	return this.kommentar;
}

Aufgabe.prototype.setKommentar = function(kommentar) {
	this.kommentar = kommentar;
}




