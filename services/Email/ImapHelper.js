const Promise = require('bluebird');
const Imap = require('imap');
const MailParser = require('mailparser').MailParser;
const simpleParser = require('mailparser').simpleParser;
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
async function findEmailIds(imap) {   
    const inbox = await imap.openBoxAsync('INBOX', true);
    return imap.searchAsync(['ALL', ['SINCE', 'September 20, 2018'], ['FROM', 'focuscontable']]);        
    
}


async function getConnection(imapConfiguration){
    const imap = new Imap(imapConfiguration);
    Promise.promisifyAll(imap);
    await connectToEmailServer(imap);
    return imap;
}

function connectToEmailServer(imap) {
    return new Promise((resolve, reject) => {
        imap.once('error', function (err) {
            console.log("Error connecting to Inbox" + err);
            reject(new Error("Error connecting to Inbox" + err));
        });

        imap.once('ready', () => {
            resolve();
        });
        imap.connect();
    });
}

 async function ds() {
    try {
        const msgsToDownLoad = await execute();
        console.log("Finally Resolved", msgsToDownLoad);
        //at this we should respond to the client, the rest of the processing is done by the queue 
        let msgToAddCount = msgsToDownLoad.length;
        const second = await new Promise((resolve, reject) => {
            imap.fetch(msgsToDownLoad, {
                bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], //HEADER.FIELDS (FROM TO SUBJECT DATE)','TEXT
                struct: true
            })
                .on('message', async (msg, sequenceNumber) => {
                    try {
                        const parsedMessage = await parseMessage(msg, sequenceNumber);
                        messagesToProcessQueue.push(parsedMessage);
                        msgToAddCount--;
                        if (msgToAddCount === 0) {
                            console.log("Finished Adding all messages to the Queue");
                            console.log("QueueSize", messagesToProcessQueue.length);
                            setTimeout(() => {
                                resolve("Finally")
                                console.log("Here");
                            }, 5000)
                        }
                    } catch (err) {
                        reject(err);
                    }

                })

                .once('error', err => {
                    reject('Error fetching messages: ' + err);
                })
                .once('end', () => {
                    console.log('Done fetching all messages !' + msgsToDownLoad);
                    imap.end();
                })
        });



    } catch (err) {
        console.log("Gotcha bitch", err);
    }
}








async function parseMessage(msg, seqno) {


    var prefix = '(#' + seqno + ') ';
    console.log('Parsing Message with id' + prefix);
    var message = {
        //info
        //attachmentsPars          
    };


    msg.on('body', function (stream, info) {
        simpleParser(stream, (err, parsed) => {
            const info = {
                to: parsed.to.text,
                from: parsed.from.text,
                date: parsed.data,
                subject: parsed.subject
            }
            message.info = info;

            fs.writeFile('Files/' + 'msg-' + seqno + '-metadata.txt', JSON.stringify(parsed, null, 2), function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
        });

    });

    msg.once('attributes', function (attrs) {
        message.uid = attrs.uid;
        //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
        fs.writeFile('Files/' + 'msg-' + seqno + '-struct.txt', JSON.stringify(attrs.struct, null, 2), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });

        message.attachments = findAttachmentParts(attrs.struct);

    });

    return new Promise((resolve, reject) => {
        msg.once('end', function () {
            console.log(prefix + 'Finished');
            resolve(message);
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
    findEmailIds
}

var JSONEncodeStream = require('./encode');
var json = JSONEncodeStream();