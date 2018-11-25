
const { fork } = require('child_process');

let forked = fork('./services/Invoice/processingQ.js');
const queueTimeout = 1000;
let lastPing = new Date().getTime();

let unsendTasks = [];

const registerListeners = () => {
    forked.on('message', (msg) => {
        console.log('Ping');
        lastPing = new Date().getTime();
        for (let task of unsendTasks) {
            forked.send(task);
        }
        
    });
    
    forked.once('exit', function (code, signal) {
        console.log('child process exited with ' +
                    `code ${code} and signal ${signal}`);
      });
}
registerListeners();


const queueIsAlive = () => {    
    const isAlive = new Date().getTime() - lastPing > queueTimeout;    
    if (!isAlive) {
        console.log('Recreate');
        forked.kill('SIGINT');
        forked = fork('./services/Invoice/processingQ.js')
        registerListeners();
    }
    return isAlive;
}

exports.processInvoice = (fileURI, attachment, companyId) => {
    const task = {fileURI, attachment, companyId}    
    if(queueIsAlive()){
        forked.send(task);
    } else{
        unsendTasks.push(task);
    }
    
       
} 


const task = {
    fileURI: 'Files/face_F0900547176003a6a62782.xml',
    attachment: {
        id: 6,
        emailId: 3
      }, 
    companyId: 3
};


exports.processInvoice(task.fileURI, task.attachment, task.companyId);    
setInterval(()=> {
    exports.processInvoice(task.fileURI, task.attachment, task.companyId);    
}, 2000);
    

