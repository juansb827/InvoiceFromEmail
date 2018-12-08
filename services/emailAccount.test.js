const emailAccount = require('./emailAccount');

async function test() {
    /*
    const account = await emailAccount
    .createEmailAccount(1, 'juansb827@gmail.com', 'GMAIL', 
        'XOAUTH2', 'TEST_SECRET_KEY', 'SAMPLEPASS12345', token            
    )*/
    const accountFound = await emailAccount.getDecryptedCredentials(15, 1, '');
    console.log('FOund', accountFound);
    //console.log("FOund", accountFound.get({plain: true}) );
    
}
test();