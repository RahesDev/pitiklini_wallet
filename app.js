require("dotenv").config();
const { mongoose } = require("./db");
const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
// const verifySignature = require('./middleware/signatureMiddleware');
// const whitelistMiddleware = require('./middleware/whitelistMiddleware');
const bitcoinRoutes = require("./routes/bitcoinRoutes");
const evmChain = require("./routes/evmRouter");
const ripple = require("./routes/xrpRouter");
const tron = require("./routes/tronRouter");
const whitelistMiddleware = require("./middleware/whitelistMiddleware");
var ip = require("ip");
var fs = require("fs");
var https = require("https");
var http = require("http");

const { sendRequestToGenerateAddress } = require("./sendreq");
const privateKeyShareRoutes = require("./routes/privateKeyShareRoutes");
const app = express();

// Allow Cross-Origin requests
app.use(cors());
//http://localhost:3001/api/v1/bitcoin/mainnet/btcwalletdetails
// Set security HTTP headers
app.use(helmet());

// Set up middleware
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(xss());
app.use(hpp());
//app.use(whitelistMiddleware);
//app.use(verifySignature);

app.use("/api/v1/bitcoin", bitcoinRoutes);
app.use("/api/v1/evmChain", evmChain);
app.use("/api/v1/xrpNetwork", ripple);
app.use("/api/v1/trxNetwork", tron);
app.use("/api/v1/privateKeyShare", privateKeyShareRoutes);
//sendRequestToGenerateAddress();
//  app.post('/triggerGenerateAddress', async (req, res) => {
//   try {
//   console.log("starting");
//   await sendRequestToGenerateAddress();
//   console.log("function started");
//   res.json({ status: 'success' });
//   } catch (error) {
//   console.log(error, "eeeeeeeeeeeeee");
//   res.status(500).json({ status: 'error', message: error.message });
//   }
//   });

app.get("/checkWallet", function (req, res) {
  return res.json({ status: "ok", port: 3001, repo: "wallet" });
});

var server = "";
var myip = ip.address();
console.log("myip===", myip);
// if (myip == "62.72.31.215") {
//   const options = {
//     key: fs.readFileSync("/var/www/html/backend/sslfiles/privkey.pem"),
//     cert: fs.readFileSync("/var/www/html/backend/sslfiles/fullchain.pem"),
//     requestCert: false,
//   };
//   server = https.createServer(options, app);
// } else {
//   server = http.createServer(app);
// }

const httpServer = http.createServer(app);
httpServer.listen(process.env.PORT, "0.0.0.0", () => {
  console.log("Wallet Server connected on", process.env.PORT);
});

// server.listen(process.env.PORT, () => {
//   console.log("Wallet Server connected on", process.env.PORT);
// });
