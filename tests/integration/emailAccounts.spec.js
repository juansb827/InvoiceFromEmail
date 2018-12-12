const expect = require("chai").expect;

const app = require("../../app");
const request = require("supertest");

describe('routes : emailAccounts', function() {

  describe('GET /api/emailAccounts/authUrl?emailAddress&provider' , function () {

    it('should return a proper response', function(done) {
        request(app)
          .get("/api/emailAccounts/authUrl")
          .query({ emailAddress: "mail@example.com", provider: "GMAIL" })
          
          .end((err, res) => {
            expect(err).to.not.exist;
            
            expect(res.body).to.include.keys('redirectURL');
            done();
            
          });
      });

    it('should return error when params are null', function(done) {

        request(app)
        .get('/api/emailAccounts/authUrl')
        .expect(400)
        .end((err, res) => {
            if (err) return done(err);
            expect(res.body).to.include.keys('error');                        
            done();
        })       
        
    })  

    
      
  });


});

