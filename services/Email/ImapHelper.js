const Promise = require('bluebird');
const Imap = require('imap');
const MailParser = require('mailparser').MailParser;
const simpleParser = require('mailparser').simpleParser;
const { EventEmitter } = require('events');
const inspect = require('util').inspect;
var fs = require('fs'), fileStream;
var utf8 = require('utf8');

var quotedPrintable = require('quoted-printable');



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
    const inbox = await imap.openBoxAsync('INBOX', true);
    //'September 20, 2018'
    //'focuscontable'
    return imap.searchAsync(['ALL', ['SINCE', startingDate ], ['FROM', sender]]);

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

function downloadAttachment(uid, part) {
    const name = part.params.name;
    if (name && name.length > 4
        && name.slice(-4).toUpperCase() === ".XML") {
        console.log("Download", name);

        imap.fetch(uid, { //do not use imap.seq.fetch here
            bodies: [part.partID],
            struct: true
        })
            .on('message', buildAttMessageFunction(part));

    }
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


function buildAttMessageFunction(attachment) {

    var filename = 'Files/' + attachment.params.name;
    var encoding = attachment.encoding;

    return function (msg, seqno) {
        var prefix = '(#' + seqno + ') ';
        msg.on('body', function (stream, info) {
            //Create a write stream so that we can stream the attachment to file;
            console.log(prefix + 'Streaming this attachment to file', filename, info);
            var writeStream = fs.createWriteStream(filename);
            writeStream.on('finish', function () {
                console.timeEnd("dbsave");
                console.log(prefix + 'Done writing to file %s', filename);
            });

            //stream.pipe(writeStream); this would write base64 data to the file.
            //so we decode during streaming using 
            if (toUpper(encoding) === 'BASE64') {
                //the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
                stream.pipe(base64.decode()).pipe(writeStream);
            } else if (toUpper(encoding) === 'QUOTED-PRINTABLE') {
                //here we have none or some other decoding streamed directly to the file which renders it useless probably
                console.time("dbsave");

                stream.pipe(json).pipe(writeStream);


            } else {
                console.log("UNKOWN ENCODING");
            }
        });
        msg.once('end', function () {
            console.log(prefix + 'Finished attachment %s', filename);
        });
    };
}

module.exports = {
    getConnection,
    findEmailIds,
    fetchEmails,
}

var JSONEncodeStream = require('./encode');
var json = JSONEncodeStream();