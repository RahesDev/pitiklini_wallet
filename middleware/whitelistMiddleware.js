const allowedIps = ['127.0.0.1','::ffff:127.0.0.1','64.226.85.108','::ffff:64.226.85.108','::1']; 

const whitelistMiddleware = (req, res, next) => {
    // const requestIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    // console.log("Request IP:", requestIp);  
    // if (allowedIps.includes(requestIp)) {
    //   next();
    // } else {
    //   res.status(403).json({ status: false, message: "Forbidden: IP not allowed" });
    // }
    next();
  };
  
  

module.exports = whitelistMiddleware;
