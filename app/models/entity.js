
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;


var PizzaSchema = new Schema({
    title: {type: String, required: true, index: true},
    tagline: String,
    slug: {type: String, index: true, unique: true},
    size: {
        type: String,
    },
    price: {
        type: Number,
    },
    image: {
        type: String,
    },
},{timestamps: true});

var OrderSchema = new Schema({
    customerId: {type: ObjectId, ref: 'User', require: true},
    slug: {type: String, index: true, unique: true},
    items: {type: Object, require: true},
    contactNumber: {type: String, require: true},
    address: {type: String, required: true},
    paymentType: {type: String, default: 'COD'},
    paymentStatus: { type: Boolean, default: false},
    status: {type: String, default: 'order_placed'},
},{timestamps: true});

var OtpSchema = new Schema({
    email: {type: String, require: true},
    otp: {type: String},
    expireIn: {type: Number},
}, {timestamps: true});


module.exports.Pizza = mongoose.model('Pizza', PizzaSchema);
module.exports.Order = mongoose.model('Order', OrderSchema);
module.exports.Otp = mongoose.model('Otp', OtpSchema, 'otp');