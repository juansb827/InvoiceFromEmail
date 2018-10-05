const Promise = require('bluebird');
const Mail = require('../db/models/index').Mail;
/**
 *  @description
 *  @param mailIds - list of ids to register in the Db
 *  @returns - the list of ids that were not registered already in the db
 */
function registerIds(mailIds){
    return new Promise((reject, resolve) =>{
        Mail.create({
            uid: 'LOLOLO'
        })
        .then(mail  => {
            console.log("Created Mail", mail);
        })

    })

    
}

module.exports = {
    registerIds 
}





