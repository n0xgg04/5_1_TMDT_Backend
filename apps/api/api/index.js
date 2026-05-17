require("reflect-metadata");
const { createNestApp } = require("../dist/src/bootstrap");

let cachedApp;

module.exports = async function handler(req, res) {
  try {
    if (!cachedApp) {
      cachedApp = await createNestApp();
      await cachedApp.init();
    }
    const expressApp = cachedApp.getHttpAdapter().getInstance();
    expressApp(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
