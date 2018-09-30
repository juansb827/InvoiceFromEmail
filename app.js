const Bluebird = require('bluebird');
const Imap = require('imap');
const MailParser = require('mailparser').MailParser;
const simpleParser = require('mailparser').simpleParser;
const inspect = require('util').inspect;
var fs = require('fs'), fileStream;
var utf8 = require('utf8');
var quotedPrintable = require('quoted-printable');



// Creating IMAP instance with configuration
const imap = new Imap({
    user: 'juansb827@gmail.com',
    password: 'EUPUNEANA12345',
    host: 'imap.gmail.com',
    port: 993,
    tls: true
});

Bluebird.promisifyAll(imap);

let downloadableEmail = {
    info: {
    },
    attachments: []
}

const messagesToProcessQueue = [];

let msgToProccessCount = 0;
imap.once('ready', execute);
function execute() {
    imap.openBoxAsync('INBOX', true)
        .then(box => {
            return imap.searchAsync(['ALL', ['SINCE', 'September 20, 2018'], ['FROM', 'focuscontable']]);
        })
        .then(results => {
            return checkIfProccessed(results);
        })
        .then(msgsToDownLoad => {
            console.log("About to parse #", msgsToDownLoad.length);
            msgToProccessCount = msgsToDownLoad.length;
            imap.fetch(msgsToDownLoad, {
                bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], //HEADER.FIELDS (FROM TO SUBJECT DATE)','TEXT
                struct: true
            })
                .on('message', (msg, sequenceNumber) => {
                    parseMessage(msg, sequenceNumber)
                        .then(parsedMessage => {
                            messagesToProcessQueue.push(parsedMessage);
                            msgToProccessCount--;
                            if(msgToProccessCount === 0){
                                console.log("Finished Parsing all messages");
                                console.log("QueueSize", messagesToProcessQueue.length);
                            }
                            
                        })
                })
                .once('error', function (err) {
                    console.log('Error fetching messages: ' + err);
                })
                .once('end', function () {
                    console.log('Done fetching all messages !' + msgsToDownLoad);
                    imap.end();
                });
        })
}


function checkIfProccessed(msgsToDownLoad) {
    return new Bluebird((resolve, reject) => {
        resolve(msgsToDownLoad)
    });
}

imap.once('error', function (err) {
    console.log(err);
});

imap.once('end', function () {
    console.log('Connection ended');
});

imap.connect();

function parseMessage(msg, seqno) {
    return new Bluebird((resolve, reject) => {
        console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';
        var message = {
            //info
            //attachments          
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


        msg.once('end', function () {
            console.log(prefix + 'Finished');
            resolve(message);
        });


    });











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



var JSONEncodeStream = require('./encode');
var json = JSONEncodeStream();