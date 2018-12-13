module.exports = (module) => {
    delete require.cache[require.resolve(module)];
    parameterStore = require(module);
}
