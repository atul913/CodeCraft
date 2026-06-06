// server/server.js
const app = require('./app')
const mongoose = require('mongoose')

require("dotenv").config();

const PORT = process.env.PORT;

// ── Database ──
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDb Connected Successfully!');

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  });
})
.catch(err => {
  console.log('Error in Mongo Db Connection: ', err);
});
