export default async function handler(req: any, res: any) {
  try {
    require("reflect-metadata");
    const { createNestApp } = require("../bootstrap");
    const app = await createNestApp();
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp(req, res);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
      stack: err.stack?.split("\n").slice(0, 15),
    });
  }
}
