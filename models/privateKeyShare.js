const mongoose = require('mongoose');

const privateKeyShareSchema = new mongoose.Schema({
share: {
type: String,
required: true
},
part: {
type: Number,
required: true
},
network: {
type: String,
required: true
}
});

const PrivateKeyShare = mongoose.model('PrivateKeyShare', privateKeyShareSchema);

module.exports = PrivateKeyShare;
