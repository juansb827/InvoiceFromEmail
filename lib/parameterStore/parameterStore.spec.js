const chai = require("chai");
const expect = require("chai").expect;

const sinon = require("sinon");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const AWS = require("aws-sdk");

const requireUncached = module => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

describe("Parameter Store", function() {
  //process.env.AWS_DEFAULT_REGION = "";
  describe("getParams", function() {
    let sandbox = null;
    let ssmStub = null;

    this.beforeEach(function() {
      sandbox = sinon.createSandbox();
      ssmStub = sandbox.stub(AWS, "SSM");
    });

    this.afterEach(function() {
      sandbox.restore();
    });

    it("should call SSM.getParameters() only once", async function() {
      const getParameters = sandbox
        .stub()
        .callsArgWith(1, null, { Parameters: [] });
      ssmStub.returns({
        getParameters: getParameters
      });
      let parameterStore = requireUncached("./parameterStore");
      parameterStore.init(["paramName1"]);
      await parameterStore.getParameters();
      sinon.assert.calledOnce(getParameters);
    });

    it('should throw error if init() is called more that once', function() {
      let parameterStore = requireUncached("./parameterStore");
      parameterStore.init('paramName', 231);
      expect(() => parameterStore.init('paramName', 231)).to.throw();
    })

    it("should retrieve the correr parameters", async function() {
      const sampleResp = {
        Parameters: [
          { Name: "paramName1", Value: "paramValue1" },
          { Name: "paramName2", Value: "paramValue2" },
          { Name: "paramName3", Value: "paramValue3" }
        ]
      };
      const getParameters = sandbox.stub().callsArgWith(1, null, sampleResp);
      ssmStub.returns({
        getParameters: getParameters
      });

      let parameterStore = requireUncached("./parameterStore");
      parameterStore.init([
        "paramName1",
        "paramName2",
        "paramName3"
      ]);
      const confParams = await parameterStore.getParameters();

      sinon.assert.calledOnce(getParameters);
      sinon.assert.calledWith(getParameters, {
        Names: ["paramName1", "paramName2", "paramName3"],
        WithDecryption: true
      });

      expect(confParams).to.deep.equal({
        paramName1: "paramValue1",
        paramName2: "paramValue2",
        paramName3: "paramValue3"
      });
    });

    it("should ignore invalid parameters", async function() {
      const mockResp = {
        Parameters: [{ Name: "paramName1", Value: "paramValue1" }],
        InvalidParameters: ["adsflkajsñkfs"] //Param not present in AWS SSM Parameter Store
      };
      const getParameters = sandbox.stub().callsArgWith(1, null, mockResp);
      ssmStub.returns({
        getParameters: getParameters
      });

      let parameterStore = requireUncached("./parameterStore");
      parameterStore.init(["paramName1", "adsflkajsñkfs"]);
      const confParams = await parameterStore.getParameters();

      expect(confParams).to.deep.equal({
        paramName1: "paramValue1"
      });
    });

    it("should cache the values ", async function() {
      const clock = sandbox.useFakeTimers();
      const mockResp = {
        Parameters: [
          { Name: "paramName1", Value: "paramValue1" },
          { Name: "paramName2", Value: "paramValue2" }
        ]
      };

      const getParameters = sinon.stub().callsArgWith(1, null, mockResp);
      ssmStub.returns({
        getParameters: getParameters
      });
      let parameterStore = requireUncached("./parameterStore");
      parameterStore.init(["paramName1", "paramName2"], 70);
      await parameterStore.getParameters();
      clock.tick(69 * 1000 );     
      await parameterStore.getParameters();
      sinon.assert.calledOnce(getParameters);
    });

    it("should re-fetch the params after expiration time passes ", async function() {
        
        const clock = sandbox.useFakeTimers();
        const mockResp = {
          Parameters: [
            { Name: "paramName1", Value: "paramValue1" },
            { Name: "paramName2", Value: "paramValue2" }
          ]
        };
  
        const getParameters = sinon.stub().callsArgWith(1, null, mockResp);
        ssmStub.returns({
          getParameters: getParameters
        });
        let parameterStore = requireUncached("./parameterStore");
        parameterStore.init(["paramName1", "paramName2"], 60 * 3);
        await parameterStore.getParameters();                  
        clock.tick(60 * 3 * 1000 );     
        await parameterStore.getParameters();
        sinon.assert.calledTwice(getParameters);        
      });
  });
});
