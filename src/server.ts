import dotenv from "dotenv";
dotenv.config(); 

import initApp from "./app";

const PORT = process.env.PORT || 3000;

initApp().then((app) => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});