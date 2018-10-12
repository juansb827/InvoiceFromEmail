require('dotenv').config();
var fs = require('fs'), fileStream;
const ImapHelper = require('./Email/ImapHelper');

async function test() {

    const connection = await ImapHelper.getConnection({
        user: 'juansb827@gmail.com',
        password: process.env.PASS,
        host: 'imap.gmail.com',
        port: 993,
        tls: true
    });

    await connection.openBoxAsync('INBOX', true);

    ImapHelper.fetchEmails(connection, [8857])
        .on('message', async (msg, sequenceNumber) => {
            try {
                const parsedMessage = msg//await ImapHelper.parseMessage(msg, sequenceNumber);
                console.log("Parsed", parsedMessage.attachments);
                
                var writeStream = fs.createWriteStream('Files/some.xml');
                writeStream.once('finish', function () {
                    console.timeEnd("dbsave");                    
                });

                const part = parsedMessage.attachments[1];
                const attchStream = await ImapHelper.getAttachmentStream(8857, part.partID, part.encoding, connection);
                attchStream.pipe(writeStream);


            } catch (err) {
                console.log('error', err);

            }
        })
        .on('error', err => {
            console.log('Error', errorHere);
        })
        .on('error', err => {
            console.log('Error fetching message info', err);
        })
        .on('end', () => {
            console.log("#################################Fetching Emails Ended");
            //connection.end();
        })


}


test().catch(err => console.log('Error con', err));