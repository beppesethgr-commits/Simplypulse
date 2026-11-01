// =====================================================================
//  MAPPATURA MIDWARE -> DASHBOARD  (da adattare alla tua installazione)
// =====================================================================
// L'app lavora su un unico dataset "documents" (righe di documenti di
// vendita). Indica qui:
//  - path/method/params: l'endpoint del web service Midware che li restituisce
//  - rowsPath: dove si trova l'array di righe nella risposta JSON
//    (es. 'data', 'result.items'; vuoto se la risposta è già un array)
//  - fields: nome del campo Midware/SimplyDevelop per ogni campo interno
module.exports = {
  documents: {
    method: 'GET',
    path: '/documents',
    // Parametri di query inviati al web service; {from} e {to} sono YYYY-MM-DD
    params: { dateFrom: '{from}', dateTo: '{to}' },
    body: null, // per POST: oggetto JSON con gli stessi segnaposto
    rowsPath: '',
    fields: {
      number: 'NumeroDocumento',
      date: 'DataDocumento',
      customer: 'RagioneSociale',
      category: 'Categoria',
      amount: 'Totale',   // imponibile / totale documento
      cost: 'Costo',      // opzionale: serve per il margine
    },
  },
};
