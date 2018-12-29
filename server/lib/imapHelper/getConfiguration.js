module.exports =  (emailAddress, provider, authMethod, xoauth2Token, password) => {
   return {
        user: emailAddress,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        xoauth2: xoauth2Token
      }

}