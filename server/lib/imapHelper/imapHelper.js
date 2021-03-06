
const Promise = require('bluebird');
const Imap = require('imap');
const MailParser = require('mailparser').MailParser;
const simpleParser = require('mailparser').simpleParser;
const { EventEmitter } = require('events');
const inspect = require('util').inspect;
var fs = require('fs'), fileStream;
const base64 = require('base64-stream');
const combine = require('multipipe');

const debug = require('debug')('invoice-processor:imap-helper');

var QuotedPrintableDecode = require('./encode');

const { AuthenticationError, InternalError, ConnectionError } = require('./Errors');



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
async function findEmailIds(imap, searchParams) {        
    
    return imap.searchAsync(searchParams);

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
            debug("connectToEmailServer", "Error creating connection to " + imapConfiguration.user);
            if (err.textCode === 'AUTHENTICATIONFAILED'){
                return reject(new AuthenticationError(err.message));
            }        
            return reject(new ConnectionError(err.message));  
        });

        imap.once('ready', () => {
            debug("connectToEmailServer", "Created connection " + imapConfiguration.user);            
            resolve(imap);
        });

        imap.once('end', () => {
            debug("connectToEmailServer", "Ended connection " + imapConfiguration.user);                        
        });

        imap.connect();
    });
}
 
 function fetchEmails(imap, emailIds) {


    const emitter = new EventEmitter();
    console.log("Fetching Emails", emailIds.length);
    process.nextTick(async ()=>{
        const FETCH_CONCURRENCY=10;
        let idx = 0;
        while (idx < emailIds.length) {
            const end = Math.min(idx + FETCH_CONCURRENCY, emailIds.length);    
            const ids = emailIds.slice(idx, end);        
            try {
                await fetchLimited(imap, ids, emitter);
                console.log("Outher - Finish", ids.length);
                idx += ids.length;
            } catch (err) {
                emitter.emit('error', err);
                break;
            }
        }
        emitter.emit('end')
        if (idx === emailIds.length) {
            console.log("Finished Fetching", emailIds.length);
        } else {
            console.log("Finished Fetching with emails left");
        }
        

    })
    

    

    

    return emitter;

}

async function fetchLimited (imap, ids, emitter) {
    await new Promise((resolve, reject) => {
        let completed = 0;
        imap.fetch(ids, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], //HEADER.FIELDS (FROM TO SUBJECT DATE)','TEXT
            struct: true
        })
            .on('message', async (msg, sequenceNumber) => {
                try {
                    const parsedMessage = await parseMessage(msg, sequenceNumber);
                    emitter.emit('message', parsedMessage);
                    completed++;
                    console.log("fetchLimited", 'Fechted a mail');
                    if (completed === ids.length) {
                        console.log("fetchLimited", 'Done fetching:' + ids.length + ' emails');
                        resolve();
                    }

                } catch (err) {                        
                    reject(err);
                }
            })
            .once('error', err => {                
                reject(err);
            })
            //.once('end', () => emitter.emit('end'));
    });
    
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

    
    return getDecodedStream(dataStream, encoding);
   
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
    
    encoding = toUpper(encoding)
    //stream.pipe(writeStream); this would write base64 
    //(or whatever the encondig of the attachment Is)           
    //so we have to decode the stream
    if (encoding === 'BASE64') {        
        return combine(stream,base64.decode());       
    }  
    if (encoding === 'QUOTED-PRINTABLE') {                     
        return  combine(stream, new QuotedPrintableDecode()); 
    } 
    
    throw new Error("unkown encoding " + encoding);
    

}

module.exports = {
    getConnection,
    findEmailIds,
    fetchEmails,
    parseMessage,
    getAttachmentStream
}


