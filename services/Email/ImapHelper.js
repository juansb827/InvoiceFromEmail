
const Promise = require('bluebird');
const Imap = require('imap');
const MailParser = require('mailparser').MailParser;
const simpleParser = require('mailparser').simpleParser;
const { EventEmitter } = require('events');
const inspect = require('util').inspect;
var fs = require('fs'), fileStream;
var utf8 = require('utf8');
const base64 = require('base64-stream')

var quotedPrintableDecode = require('./encode')();



let downloadableEmail = {
    info: {
    },
    attachments: []
}




const messagesToProcessQueue = [];

let msgToProccessCount = 0;

/**
 * 
 * @param {*} imap - an Imap instance
 */
async function findEmailIds(imap, startingDate, sender) {    
    //'September 20, 2018'
    //'focuscontable'
    return imap.searchAsync(['ALL', ['SINCE', startingDate], ['FROM', sender]]);

}


async function getConnection(imapConfiguration) {
    const connection = await connectToEmailServer(imapConfiguration);
    return connection;
}

function connectToEmailServer(imapConfiguration) {
    const imap = new Imap(imapConfiguration);

    return new Promise((resolve, reject) => {
        Promise.promisifyAll(imap);

        imap.once('error', function (err) {
            console.log("ImapHelper- connectToEmailServer", "Error creating connection " + imapConfiguration.user);
            reject(new Error("Error connecting to Inbox" + err));
        });

        imap.once('ready', () => {
            console.log("ImapHelper- connectToEmailServer", "Created connection " + imapConfiguration.user);
            resolve(imap);
        });

        imap.once('end', () => {
            console.log("ImapHelper- connectToEmailServer", "Ended connection " + imapConfiguration.user);
        });

        imap.connect();
    });
}

function fetchEmails(imap, emailIds) {


    const emitter = new EventEmitter();

    imap.fetch(emailIds, {
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], //HEADER.FIELDS (FROM TO SUBJECT DATE)','TEXT
        struct: true
    })
        .on('message', async (msg, sequenceNumber) => {
            try {
                const parsedMessage = await parseMessage(msg, sequenceNumber);
                emitter.emit('message', parsedMessage);
            } catch (err) {
                emitter.emit('error', err);

            }
        })
        .once('error', err => {
            emitter.emit('error', error);
        })
        .once('end', () => emitter.emit('end'));

    return emitter;

}

async function parseMessage(msg, seqno) {

    let message = {
        //info
        //attachmentsPars          
    };

    let parsedBody = false;
    let parsedAttributes = false;

    return new Promise((resolve, reject) => {

        msg.once('body', async function (stream, msgInfo) {
            try {

                let parsed = await simpleParser(stream);
                let from = parsed.from.value[0].address;
                const info = {
                    to: parsed.to.text,
                    from: from,
                    date: parsed.date,
                    subject: parsed.subject
                }
                message.info = info;
                parsedBody = true;
                if (parsedAttributes) {
                    resolve(message);
                }
            } catch (err) {
                reject(err);
            }
            /*
            fs.writeFile('Files/' + 'msg-' + seqno + '-metadata.txt', JSON.stringify(parsed, null, 2), function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            }); */


        });

        msg.once('attributes', function (attrs) {
            try {
                message.uid = attrs.uid;
                message.attachments = findAttachmentParts(attrs.struct);
                parsedAttributes = true;
                if (parsedBody) {
                    resolve(message);
                }
                /*
                //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                fs.writeFile('Files/' + 'msg-' + seqno + '-struct.txt', JSON.stringify(attrs.struct, null, 2), function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("The file was saved!");
                });
                */
            } catch (err) {
                resolve(err);
            }


        });



    })





}

async function getAttachmentStream(mailId, attachmentPartId, encoding, imap) {

    if (!mailId) {
        throw new Error('[getAttachmentStream]', 'Invalid uid', mailId);
    }

    if (!attachmentPartId) {
        throw new Error('[getAttachmentStream]', 'Invalid Attachment Part', attachmentPartId);
    }

    let dataStream = await new Promise((resolve, reject) => {
        let fetch = imap.fetch(mailId, { //do not use imap.seq.fetch here
            bodies: [attachmentPartId],
            //struct: true
        });
        fetch.once('message', (message, seqno) => {
            message.once('body', (stream, info) => {
                resolve(stream)
            });
            message.once('error', err => reject(err));
        });
    });

    var filePath = `Files/${mailId}`;
    return getDecodedStream(dataStream, encoding);
    /* if (err.message === 'UNKNOW ENCODING') {
        return reject(new Error('INVALID FILE'));
    } */
}

function findAttachmentParts(struct, attachments) {
    attachments = attachments || [];
    var len = struct.length
    for (var i = 0; i < len; ++i) {
        if (Array.isArray(struct[i])) {
            findAttachmentParts(struct[i], attachments);
        } else {
            if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) > -1) {
                attachments.push(struct[i]);
            }
        }
    }
    return attachments;
}

function toUpper(thing) { return thing && thing.toUpperCase ? thing.toUpperCase() : thing; }


function getDecodedStream(stream, encoding) {


    //stream.pipe(writeStream); this would write base64 
    //(or whatever the encondig of the attachment Is)           
    //so we have to decode the stream
    if (toUpper(encoding) === 'BASE64') {
        //the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
        console.time("dbsave");
        return stream.pipe(base64.decode());

    } else if (toUpper(encoding) === 'QUOTED-PRINTABLE') {
        console.time("dbsave");
        return stream.pipe(quotedPrintableDecode);
    } else {
        throw new Error("UNKOWN ENCODING");
    }

}

module.exports = {
    getConnection,
    findEmailIds,
    fetchEmails,
    parseMessage,
    getAttachmentStream
}


