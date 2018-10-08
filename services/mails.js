require('dotenv').config()
const Promise = require('bluebird');
const crypto = require("crypto");

const { sequelize } = require('../db/models');
const { Email } = require('../db/models');
const EmailHelper = require('./Email/ImapHelper')

searchEmails().then(mailIds => {
    console.log("Finished:##", mailIds.length);
})
    .catch(err => {
        console.log("Could not download emails", err);
    });


async function searchEmails(searchParams) {
    
    const connection = await EmailHelper.getConnection({
        user: 'juansb827@gmail.com',
        password: 'EUPUNEANA12345',
        host: 'imap.gmail.com',
        port: 993,
        tls: true
    });
    //'focuscontable@gmail.com'
    let emailIds = await EmailHelper.findEmailIds(connection, 'September 20, 2018' ,'notifications@github.com');
    let unproccessedEmailIds = await bulkRegister(emailIds);//emailIds //

    
    //TODO: starts proccessing the emails asynchronously
    proccessEmailsAsync(connection, unproccessedEmailIds);
    
    
    return unproccessedEmailIds;

}

/**
 * @description - fetchs the emails and inserts their information (subject, date, header, etc..) into the db
 */
function proccessEmailsAsync(connection, emailIds){
    console.log("Started email proccessing async");

    //TODO: (Somehow) Continue incase the process is interrupted
    EmailHelper.fetchEmails(connection, emailIds)
        .on('message', message =>{
            //console.log('Fetched message ', message.uid);            
            const _msg = {
                from: message.info.from,
                subject: message.info.subject,
                date: message.info.date, 
                proccessed: true,
                processingState: 'INFO',
                attachments: message.attachments.length, 
            }

            const matchingAttachments = message.attachments;
            if(matchingAttachments.length === 0){                
                _msg.processingState = 'DONE';
                _msg.attachmentsState = 'DONE';
                _msg.matchingAttachments = 0;
            }

            Email.update(_msg, {
                where: { uid: ''+message.uid }
            })
            .then(()=>{
                //TODO: start async attachment proccessing

            })
            .catch(err => {
                //TODO: (Somehow) Retry failed emails
                console.log('Error updating email info', err);        
            });
        })
        .on('error', err =>{
            console.log('Error fetching message info', err);
        })
        .on('end', ()=>{
            console.log("#################################Proccess Ended");
            connection.end();
        })
}

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





