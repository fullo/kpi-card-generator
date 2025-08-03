# **Generatore di Carte KPI per Workshop**

Questo repository contiene un generatore basato su Node.js per creare mazzi di carte da gioco personalizzate, pensate per workshop interattivi su Metriche e Key Performance Indicators (KPI).

Lo script prende i dati da file JSON, li unisce a un template HTML e genera un file HTML pronto per il browser e un PDF ottimizzato per la stampa fronte-retro.

\<\!-- Sostituisci con uno screenshot reale delle tue carte \--\>

## **Requisiti**

Per utilizzare questo generatore, sono necessari i seguenti strumenti:

* **Node.js:** (Versione 16 o superiore) \- Per eseguire lo script.  
* **Git:** Per clonare il repository e gestire le versioni.

## **Installazione**

1. **Clona il repository:**  
   git clone \[https://github.com/TUO\_NOME\_UTENTE/kpi-card-generator.git\](https://github.com/TUO\_NOME\_UTENTE/kpi-card-generator.git)  
   cd kpi-card-generator

2. Installa le dipendenze:  
   Questo comando installerà le librerie necessarie (commander per la gestione dei comandi e puppeteer per la generazione del PDF).  
   npm install

## **Struttura del Progetto**

Il generatore è progettato per essere modulare e facile da espandere:

* kpi-card-generator.js: Il cuore dello script. Legge i dati e il template, e genera i file di output.  
* package.json: Definisce le dipendenze e la configurazione del progetto.  
* assets/card-template.html: Il template HTML che definisce l'aspetto di ogni carta (fronte e retro). Puoi modificare questo file per cambiare lo stile di tutte le carte.  
* esercizio-\*.json: File di dati che contengono i testi, le icone e gli stili per le carte di ogni singolo esercizio. Per aggiungere nuove carte o esercizi, basta creare o modificare questi file.

## **Come Usare lo Script**

Lo script si esegue da riga di comando. Assicurati di essere nella cartella principale del progetto.

### **Sintassi**

node kpi-card-generator.js \-i \<file\_input.json\> \[opzioni\]

### **Parametri**

| Parametro | Alias | Descrizione | Default |
| :---- | :---- | :---- | :---- |
| \--input \<file\> | \-i | **(Obbligatorio)** Specifica il file JSON di input per l'esercizio. | \- |
| \--output \<file\> | \-o | Genera un file **PDF** pronto per la stampa. | \- |
| \--browser \<file\> | \-b | Genera un file **HTML** per la visualizzazione nel browser. | \- |
| \--template \<file\> | \-t | Specifica un percorso alternativo per il file del template HTML. | assets/card-template.html |
| \--help | \-h | Mostra la guida completa dei comandi. | \- |

### **Esempi di Utilizzo**

* **Generare PDF e HTML per l'Esercizio 1:**  
  node kpi-card-generator.js \-i esercizio-1-azione.json \-o Esercizio1.pdf \-b Esercizio1.html

* **Generare solo il PDF per l'Esercizio 3:**  
  node kpi-card-generator.js \-i esercizio-3-cimitero.json \-o Esercizio3.pdf

* **Generare l'HTML usando un template personalizzato:**  
  node kpi-card-generator.js \-i esercizio-5-cavalieri.json \-b Cavalieri.html \-t assets/template-alternativo.html

## **Licenza**

Questo progetto ha una doppia licenza:

### **Codice Sorgente**

Il codice dello script (kpi-card-generator.js, package.json, etc.) è rilasciato sotto **Licenza MIT**. Sei libero di usarlo, modificarlo e distribuirlo come preferisci.

### **Contenuto delle Carte**

Il contenuto testuale e concettuale delle carte (i testi nei file .json) è proprietà intellettuale di **Daruma Consulting di Francesco Fullone** ed è rilasciato sotto licenza **Creative Commons Attribuzione \- Non commerciale \- Condividi allo stesso modo 4.0 Internazionale (CC BY-NC-SA 4.0)**.

Questo significa che sei libero di:

* **Condividere:** copiare e ridistribuire il materiale in qualsiasi formato.  
* **Modificare:** trasformare il materiale e basarti su di esso per le tue opere.

Alle seguenti condizioni:

* **Attribuzione:** Devi dare credito a "Daruma Consulting di Francesco Fullone" e fornire un link alla licenza.  
* **Non Commerciale:** Non puoi usare il materiale per scopi commerciali.  
* **Condividi allo stesso modo:** Se modifichi il materiale, devi distribuire i tuoi contributi con la stessa licenza.

## **Crediti**

Questo progetto è stato ideato e sviluppato da **Francesco Fullone** per i suoi workshop su Metriche e KPI.
