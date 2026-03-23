const fs = require('fs');
const pdf = require('pdf-parse');
let dataBuffer = fs.readFileSync('D:\\PX AgenturApp\\INPUT\\260310_Dispo_Disney+_Magazin.pdf');
pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(err => console.error(err));
