
const { fork } = require('child_process');
const forked = fork('./services/Invoice/processingQ.js');

let lastPing = new Date().getTime();
let queueAlive = true;

forked.on('message', (msg) => {
   });


  

const task = {
    fileURI: 'Files/face_F0900547176003a6a62782.xml',
    attachment: {
        id: 6,
        emailId: 3
      }, 
    companyId: 3
};

for (let i=0; i < 1; i++ ) {
    forked.send(task);
}

