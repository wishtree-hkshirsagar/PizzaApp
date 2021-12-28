//Schema for Courses, Blocks, Groups and related items
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
    createdAt: {type: Date, default: Date.now},
    updated_at: Date,
});


module.exports.Pizza = mongoose.model('Pizza', PizzaSchema);
