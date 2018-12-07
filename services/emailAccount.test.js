const emailAccount = require('./emailAccount');
let token = { "access_token":"ya29.GltoBio-LUEPSeDfng2SKy11RZMLbNDW2livipbQfdBt67HGDM3nzYWrycPBZ4MXLQdzHN4qrJco0Y7kJRsCN9_On7xPASuXyWkdWo6uewJrDBvoc_QcSYTxzhId", 
"refresh_token":"1/NMuwBIhmxByX4PC0fvpmtIq5-B7WeKqkma76UxzfjPvgRmnXCQG0qutMGMNQfcMU",
"scope":"https://mail.google.com/",
"token_type":"Bearer",
  "expiry_date":1543962003967};
async function test() {
    /*
    const account = await emailAccount
    .createEmailAccount(1, 'juansb827@gmail.com', 'GMAIL', 
        'XOAUTH2', 'TEST_SECRET_KEY', 'SAMPLEPASS12345', token            
    )*/
    const accountFound = await emailAccount.getDecryptedCredentials(15, 1, 'TEST_SECRET_KEY');
    console.log('FOund', accountFound);
    //console.log("FOund", accountFound.get({plain: true}) );
    
}
test();