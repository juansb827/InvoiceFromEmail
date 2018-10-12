require('dotenv').config();
const Promise = require('bluebird');
const crypto = require("crypto");

const { sequelize } = require('../db/models');
const { Email } = require('../db/models');
const EmailHelper = require('./Email/ImapHelper')
const async = require('async');
var fs = require('fs'), fileStream;

searchEmails().then(mailIds => {
    console.log("Finished:##", mailIds.length);
})
    .catch(err => {
        console.log("Could not download emails", err);
    });


//TODO: Should be called by route
async function searchEmails(searchParams) {

    const connection = await EmailHelper.getConnection({
        user: 'juansb827@gmail.com',
        password: process.env.PASS,
        host: 'imap.gmail.com',
        port: 993,
        tls: true
    });
    //'notifications@github.com'
    let emailIds = await EmailHelper.findEmailIds(connection, 'September 20, 2018', 'focuscontable@gmail.com');
    let unproccessedEmailIds = await bulkRegister(emailIds);//emailIds //


    //Starts proccessing the emails asynchronously
    proccessEmailsAsync(connection, unproccessedEmailIds);


    return unproccessedEmailIds;

}

/**
 * @description - fetches the emails and inserts their information (subject, date, header, etc..) into the db
 */
function proccessEmailsAsync(connection, emailIds) {
    console.log("Started email proccessing async");

    //TODO: (Somehow) Continue incase the process is interrupted
    EmailHelper.fetchEmails(connection, emailIds)
        .on('message', message => {

            //console.log('Fetched message ', message.uid);            
            const _msg = {
                from: message.info.from,
                subject: message.info.subject,
                date: message.info.date,
                proccessed: true,
                processingState: 'INFO',
                attachments: message.attachments.length,
            }


            if (message.attachments.length === 0) {
                _msg.processingState = 'DONE';
                _msg.attachmentsState = 'DONE';
                _msg.matchingAttachments = 0;

                return Email.update(_msg, {
                    where: { uid: '' + message.uid }
                });

            }

            //Starts async attachments proccessing                                  
            Email.update(_msg, {
                where: { uid: '' + message.uid }
            }).then(() => {
                return processAttachmentsAsync(message.uid, message.attachments, connection)
            }).then(processedCount => {
                    _msg.processingState = 'DONE';
                    _msg.attachmentsState = 'DONE';
                    _msg.matchingAttachments = processedCount;
                    return Email.update(_msg, {
                        where: { uid: 'ds' + message.uid }
                    })
                })
                .catch(err => {
                    //TODO: (Somehow) Retry failed emails
                    console.log('Error updating email info', err);
                });








        })
        .on('error', err => {
            console.log('Error fetching message info', err);
        })
        .on('end', () => {
            console.log("###Fetched all mails from inbox");
            //connection.end();
        })
}

/**
 * @description - fetches email attachments and processes them accordingly (e.g converts them .XML into Invoices)
 * @param uid - id of the email in the inbox
 * @param attachments - attachment parts
 */
async function processAttachmentsAsync(uid, attachments, connection) {

    if (!uid || !attachments) {
        console.log('processAttachmentsAsync', 'Invalid Param');
    }

    function process(attch, cb) {
        EmailHelper.getAttachmentStream(uid, attch.partID, attch.encoding, connection)
            .then(attchStream => {
                const fileName = 'Files/' + attch.params.name;
                var writeStream = fs.createWriteStream(fileName);

                writeStream.once('finish', () => {
                    console.log('Wrote', fileName);
                    cb();
                });

                writeStream.on('error', (err) => {
                    cb(err);
                })
                attchStream.pipe(writeStream);
            })
    }
    let filtered = filterAttachments(attachments);

    return new Promise((resolve, reject) => {
        async.each(filtered, process, (err) => {
            if (err) {
                return reject(err);
            }
            resolve(filtered.length);
        });
    })




}

function filterAttachments(attachments) {
    return attachments.filter(part => {
        const name = part.params.name;
        if (!name) {
            return false;
        }

        const extention = name.slice(-4).toUpperCase();

        if (extention === '.XML'
            || extention === '.PDF') {
            return true;
        }

        return false;
    })
};

/**
 *  @description - inserts the id of the email (the id which comes from the inbox) into the db
 *  so we can keep track of what emails have been already proccessed  
 *  @param mailIds - list of ids to register in the Db
 *  @returns - the list of ids that were not already registered  in the db
 */
function bulkRegister(ids) {

    if (!ids || ids.length == 0) {
        return Promise.reject(new Error('Ids is empty'));
    }

    const batchId = crypto.randomBytes(16).toString('hex');

    const emails = ids.map(id => {
        return {
            uid: id,
            batchId: batchId
        }
    })



    return new Promise((resolve, reject) => {
        Email.bulkCreate(emails, { ignoreDuplicates: true })
            .then(() => {
                //bulkCreate doesnt return the uids so we have to do a query to find them
                return Email.findAll({
                    attributes: ['uid'],
                    where: { batchId: batchId }
                });

            })
            .then(createdEmails => {
                const emailIds = createdEmails.map(mail => mail.get('uid'))
                resolve(emailIds);
            })
            .catch(err => {
                reject(err);
            })
    })

}
/*
bulkRegister(['4324321332123s3','32131']).then(succ => {
    console.log('success', succ);
})
    .catch(err => {
        console.log("*************************", err);

    }) */

module.exports = {
    bulkRegister
}





