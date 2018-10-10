require('dotenv').config();
const ImapHelper = require('./Email/ImapHelper');

async function test(){
    const connection = await ImapHelper.getConnection({
        user: 'juansb827@gmail.com',
        password: process.env.PASS,
        host: 'imap.gmail.com',
        port: 993,
        tls: true
    });

    await connection.openBoxAsync('INBOX', true);

    connection.fetch([8857], { //do not use imap.seq.fetch here
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
        struct: true
    })
    .on('message', async (msg, sequenceNumber) => {
        try {
            const parsedMessage = await ImapHelper.parseMessage(msg, sequenceNumber);            
            console.log("Parsed", parsedMessage.attachments);
            const fileURI = await ImapHelper.downloadAttachment(8857, parsedMessage.attachments[0], connection);
            console.log('URI', fileURI);


        } catch (err) {
        console.log('error', err);

        }
    })
    .on('error', err=>{
        console.log('Error', errorHere);
    })

    
}


test().catch(err=> console.log('Error con', err) );