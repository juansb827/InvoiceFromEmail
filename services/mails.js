require('dotenv').config();
const Promise = require('bluebird');
const crypto = require("crypto");

const { sequelize } = require('../db/models');
const { Email, Attachment } = require('../db/models');
const EmailHelper = require('./Email/ImapHelper')

const ImapConnections = require('./Email/ImapConnections');
const connectionsHelper = new ImapConnections();

const async = require('async');
var fs = require('fs'), fileStream;

searchEmails().then(mailIds => {
    console.log("Finished:##", mailIds);
})
    .catch(err => {
        console.log("Could not download emails", err);
    });


//TODO: Should be called by route

async function searchEmails(searchParams) {
    
    try{
        const connection = await connectionsHelper.getConnection('juansb827@gmail.com');
    }catch(err){
        logger.error('searchEmails, could not get the connection: ', err.message);
    }
    


    //if (1==1 )return ['3:v'];
    //'notifications@github.com'
    let emailIds = await EmailHelper.findEmailIds(connection, 'September 20, 2018', 'focuscontable@gmail.com');
    await connectionsHelper.releaseConnection(connection);
    let unproccessedEmails = await bulkRegister(emailIds);//emailIds //


    //Starts proccessing the emails asynchronously
    proccessEmailsAsync(unproccessedEmails);



    return unproccessedEmails;

}

/**
 * @description - fetches the emails and inserts their information (subject, date, header, etc..) into the db
 * 
 * //TODO: (Somehow) Continue in case the process gets interrupted
 */
async function proccessEmailsAsync(unproccessedEmails) {
    console.log("Started email proccessing async");
    const connection = await connectionsHelper.getConnection('juansb827@gmail.com');
    const uids = unproccessedEmails.map(mailInfo => mailInfo.uid);
    //to retrieve email PK with its uid
    const pkByUid = {};
    unproccessedEmails.forEach(mailInfo => {
        pkByUid[mailInfo.uid] = mailInfo.id;
    });

    EmailHelper.fetchEmails(connection, uids)
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

            //inside a transaction

            //Registers the info of the email (and its attachments)
            return sequelize.transaction(t => {

                let chain = Email.update(_msg, {
                    where: { uid: '' + message.uid },
                    transaction: t
                });
                const registeredAttchs = [];
                message.attachments.forEach(attch => {
                    chain = chain.then(() => {
                        return Attachment.create({
                            emailId: pkByUid[message.uid],
                            partId: attch.partID,
                            name: attch.params.name,
                            size: attch.size,
                            encoding: attch.encoding
                        }, { transaction: t }).then(result => {
                            registeredAttchs.push(result);
                        })
                    })

                })

                return chain.then(() => {
                    return registeredAttchs;
                });
            })
                .then(registeredAttchs => {
                    console.log("TRANSACTION ENDED");
                    processAttachmentsAsync(pkByUid[message.uid], message.uid, registeredAttchs);
                })
                .catch(err => {
                    console.log("Transaction Failed", err);
                })
            //const filteredAttch = filterAttachments(message.attachments);




            if (1 == 1) return;
            //Starts async attachments proccessing                                  
            Email.update(_msg, {
                where: { uid: '' + message.uid }
            })
                .then(() => {
                    return processAttachmentsAsync(message.uid, message.attachments)
                })
                .then(processedCount => {
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
 * @param mailId - id of the email in the db
 * @param uid - id of the email in the inbox
 * @param attachments - array of models.Attachment instances
 */
async function processAttachmentsAsync(emailId, uid, attachments) {

    if (!uid || !attachments) {
        console.log('processAttachmentsAsync', 'Invalid Param');
        return;
    }

    async function process(attch) {
        const attchPk = attch.id;
        const name = attch.name;
        const extention = name.slice(-4).toUpperCase();
        switch (extention) {
            case '.PDF':
                const task = async () => {
                    const connection = await connectionsHelper.getConnection('juansb827@gmail.com');
                    const attchStream = await EmailHelper.getAttachmentStream(uid, attch.partId, attch.encoding, connection);
                    const fileName = 'Files/' + attch.name;
                    var writeStream = fs.createWriteStream(fileName);
                    return new Promise((resolve, reject) => {
                        writeStream.once('finish', () => {
                            console.log('Wrote', fileName);
                            connectionsHelper.releaseConnection(connection);
                            resolve();


                        });

                        writeStream.on('error', (err) => {
                            connectionsHelper.releaseConnection(connection);
                            reject(err);
                        });
                        attchStream.pipe(writeStream);
                    }).then((byteArray) => {
                        return Attachment.update({ processingState: 'DONE' }, {
                            where: { id: attchPk }
                        })
                    });
                }
                return task();

            case '.XMLL':
                return Attachment.update({ processingState: 'DONE' },
                    {
                        where: { id: attchPk }
                    })

            default:
                return Attachment.update(
                    { processingState: 'SKIPPED' },
                    {
                        where: { id: attchPk }
                    })
        }






    }
    //let filtered = filterAttachments(attachments);
    new Promise((resolve, reject) => {
        async.each(attachments, process, (err) => {
            if (err) {
                return reject(err);            
            }
            console.log(`All Attachments of mail ID: ${emailId}, uid:${uid} processed`);               
            resolve();            
        });
    })
    .then(()=>{
        return Attachment.findAll({
            attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'attch_count']],
            where: { emailId: emailId, processingState: 'DONE' }
        })
    })  
    .then(result => {
        const count = result[0].get('attch_count');
        Email.update({ attachmentsState: 'DONE', matchingAttachments: count }, {
            where: { id: emailId }
        })
    })
    .catch(err=> {
        console.log(`[processAttachmentsAsync] failed for mail ID: ${emailId} with uid:${uid}`, err);
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
 *  @returns - the list of emails (only the ids uid) that were not already registered  in the db
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
                    attributes: ['id', 'uid'],
                    where: { batchId: batchId }
                });

            })
            .then(createdEmails => {
                const emailIds = createdEmails.map(mail => {
                    return { id: mail.get('id'), uid: mail.get('uid') };
                });
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





