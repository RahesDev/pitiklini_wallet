const mongoose = require('mongoose');

// mongoose.connect("mongodb+srv://devtest594:A5ca3rBgNhLGDOq5@voltrix.tukg1.mongodb.net/vtx", {useNewUrlParser: true,useUnifiedTopology: true }, (err) => {
//     if (!err)
//         console.log('MongoDB connection succeeded.');
//     else
//         console.log('Error in DB connection: ' + JSON.stringify(err, undefined, 2));
// });

// module.exports = mongoose;


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connection succeeded.');
    } catch (err) {
        console.error('Error in DB connection:', err);
    }
  };
  
 connectDB();