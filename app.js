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

function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

imap.once('ready', function () {
    openInbox(function (err, box) {
        if (err) throw err;
        imap.search(['ALL', ['SINCE', 'September 20, 2018'], ['FROM', 'focuscontable']], function (err, results) {
            if (err) throw err;
            console.log("Results are" + results);

            //var f = imap.fetch(results, { bodies: 'HEADER.FIELDS (TO FROM SUBJECT)' });
            var f = imap.fetch(results, {
                bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], //HEADER.FIELDS (FROM TO SUBJECT DATE)','TEXT
                struct: true
            });

            let messages = [];
            f.on('message', function (msg, seqno) {
                console.log('Message #%d', seqno);
                var prefix = '(#' + seqno + ') ';
                msg.on('body', function (stream, info) {
                    console.log(prefix + 'Body');
                    simpleParser(stream, (err, parsed) => {

                        fs.writeFile('Files/' + 'msg-' + seqno + '-metadata.txt', JSON.stringify(parsed, null, 2), function (err) {
                            if (err) {
                                return console.log(err);
                            }

                            console.log("The file was saved!");
                        });
                    });
                    //stream.pipe();

                });

                msg.once('attributes', function (attrs) {
                    //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));

                    fs.writeFile('Files/' + 'msg-' + seqno + '-struct.txt', JSON.stringify(attrs.struct, null, 2), function (err) {
                        if (err) {
                            return console.log(err);
                        }

                        console.log("The file was saved!");
                    });

                    var attachmentsParts = findAttachmentParts(attrs.struct);
                    attachmentsParts.forEach((part) => {
                        const name = part.params.name;
                        if (name && name.length > 4
                            && name.slice(-4).toUpperCase() === ".XML") {
                            console.log("Download", name);

                            imap.fetch(attrs.uid, { //do not use imap.seq.fetch here
                                bodies: [part.partID],
                                struct: true
                            })
                                .on('message', buildAttMessageFunction(part));

                        }

                    });
                    console.log(prefix + 'Has attachments: %d', attachmentsParts.length);


                });


                msg.once('end', function () {
                    console.log(prefix + 'Finished');
                });







            });
            f.once('error', function (err) {
                console.log('Fetch error: ' + err);
            });
            f.once('end', function () {
                console.log('Done fetching all messages!');
                imap.end();
            });
        });

    });
});


imap.once('error', function (err) {
    console.log(err);
});

imap.once('end', function () {
    console.log('Connection ended');
});

imap.connect();



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
                console.log(prefix + 'Done writing to file %s', filename);
            });

            //stream.pipe(writeStream); this would write base64 data to the file.
            //so we decode during streaming using 
            if (toUpper(encoding) === 'BASE64') {
                //the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
                stream.pipe(base64.decode()).pipe(writeStream);
            } else {
                //here we have none or some other decoding streamed directly to the file which renders it useless probably
                
                    var lel = utf8.decode(quotedPrintable.decode(stream));
                   
                
            }
        });
        msg.once('end', function () {
            console.log(prefix + 'Finished attachment %s', filename);
        });
    };
}



