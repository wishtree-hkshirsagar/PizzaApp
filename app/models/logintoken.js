//Schema for storing cookies - Remember Me
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;
//LoginToken Schema
var LoginTokenSchema = new Schema({
    userid: { type: ObjectId, index: true },
    token: {type: String, index: true },
    created_at: {type: Date, default: Date.now, expires: 604800}
});
//Create the model for User and expose it to app
module.exports.LoginToken = mongoose.model('LoginToken', LoginTokenSchema);
