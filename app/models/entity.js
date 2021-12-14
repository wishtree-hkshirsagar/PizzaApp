//Schema for Courses, Blocks, Groups and related items
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;
//Schema: Member
var MemberSchema = new Schema({
    user: {type: ObjectId, ref: 'User'},
    added_by: {type: ObjectId, ref: 'User'},
    added_at: Date,
    email: {type: String, index: true},
    permit_val: {type: String, enum: ['moderator', 'teacher', 'active', 'inactive', 'invited']}
});
//Schema: Learner
var LearnerSchema = new Schema({
    user: {type: ObjectId, ref: 'User'},
    progress: {type: String, enum: ['started', 'active', 'completed', 'uncertified', 'certified']},
    containers: [{type: ObjectId, ref: 'Block'}],
    created_at: {type: Date, default: Date.now},
    updated_at: Date
});
//Schema: Viewer
var ViewerSchema = new Schema({
    user: {type: ObjectId, ref: 'User'},
    count: {type: Number, default: 1},
    updated_at: Date
});
//Schema: Course
var CourseSchema = new Schema({
    title: {type: String, required: true, index: true},
    tagline: String,
    slug: {type: String, index: true, unique: true},
    image: {
        m: String,
        l: String
    },
    bound: Number,
    org: {
        name: String,
        logo: String,
        url: String
    },
    is_active: {type: Boolean, default: true},
    privacy: {type: String, enum: ['public', 'private', 'unlisted'], index: true, default: 'private'},
    join_code: {type: String, index: true},
    certification: {type: Boolean, default: false},
    tag: {
        core: String,
        sel: String,
        sdg: String
    },
    /* User */
    creator: {type: ObjectId, ref: 'User'},
    created_at: {type: Date, default: Date.now},
    updated_at: Date,
    /* User actions */
    members: [MemberSchema],
    learners: [LearnerSchema],
    /* If copied */
    parent_id: ObjectId,
    /* Theme */
    color: {
        a: String,
        b: String
    },
    /* Viewers */
    viewers: [ViewerSchema],
    /* Count */
    count: {
        skills: {type: Number, default: 0},
        badges: {type: Number, default: 0},
        members: {type: Number, default: 0},
        learners: {type: Number, default: 0},
        time: {type: Number, default: 0}
    }
});
//Schema: Badge
var BadgeSchema = new Schema({
    title: {type: String, required: true, index: true},
    color: String,
    image: {
        m: String,
        l: String
    },
    bound: Number,
    /* Is skill */
    is_skill: {type: Boolean, default: false},
    skill_total: {type: Number, default: 0},
    /* Course */
    course: {type: ObjectId, ref: 'Course'},
    /* User */
    creator: {type: ObjectId, ref: 'User'},
    created_at: {type: Date, default: Date.now},
    updated_at: Date
});
//Schema: Attachment
var AttachmentSchema = new Schema({
    type: {type: String, enum: ['audio', 'video', 'file']},
    file: {
        size: Number,
        icon: String,
        ext: String
    },
    provider: {
        name: String,
        url: String,
        favicon: String
    }
});
//Schema: Response
var ResponseSchema = new Schema({
    /* Text */
    text: String,
    summary: String,
    image: {
        m: String,
        l: String
    },
    bound: Number,
    images: [String],
    /* Audio, Video, File */
    attachments: [AttachmentSchema],
    /* Match the following */
    matched_to: {type: ObjectId, ref: 'Option'},
    /* Order for Grid cell */
    order: {type: Number, index: true},
    /* User */
    creator: {type: ObjectId, ref:'User'},
    created_at: { type: Date, default: Date.now },
    updated_at: Date
});
//Schema: MCQ and Match the following options
var OptionSchema = new Schema({
    text: String,
    image: {
        m: String,
        l: String
    },
    bound: String,
    is_correct: {type: Boolean, default: false},
    /* Match the following */
    correct_options: [{type: ObjectId, ref: 'Option'}],
    matchers: [ResponseSchema],
    color: String,
    is_optionb: {type: Boolean, default: false},
    /* MCQ */
    voters: [{type: ObjectId, ref: 'User'}]
});
//Schema: Fill in the blanks
var FillSchema = new Schema({
    text: String,
    /* If blank */
    is_blank: {type: Boolean, default: 'false'},
    size: Number,
    keywords: [String],
    /* Responses */
    responses: [ResponseSchema]
});
//Schema: Item - Table, List or Grid items
var ItemSchema = new Schema({
    type: {type: String, required: true, enum: ['text', 'image', 'audio', 'video', 'file', 'link', 'header', 'checkbox', 'locked', 'button', 'response'], default: 'text'},
    /* Table cell */
    row: Number,
    col: Number,
    /* Text */
    title: String,
    summary: String,
    text: String,
    /* Image */
    image: {
        m: String,
        l: String
    },
    bound: Number,
    images: [String],
    /* File, Audio, Video */
    file: {
        size: Number,
        icon: String,
        ext: String
    },
    /* Link | File | Embed */
    provider: {
        name: String,
        url: String,
        favicon: String
    },
    embed: String, //video code or embed code
    embed_type: String,
    publish_date: Date,
    /* Button */
    button: {
        url: String,
        block: Number,
        is_new_tab: {type: Boolean, default: true}
    },
    /* Response */
    is_right: {type: Boolean, default: false},
    responses: [ResponseSchema],
    /* User */
    creator: {type: ObjectId, ref:'User'},
    created_at: { type: Date, default: Date.now },
    updated_at: Date
});
//Schema: Comment
var CommentSchema = new Schema({
    /* Text */
    text: String,
    summary: String,
    image: {
        m: String,
        l: String
    },
    bound: Number,
    images: [String],
    /* Audio, Video, File */
    attachment: [AttachmentSchema],
    /* Actions */
    likes: [{type: ObjectId, ref: 'User'}],
    is_recent: {type: Boolean},
    reply_to: ObjectId,
    /* User */
    creator: {type: ObjectId, ref:'User'},
    created_at: { type: Date, default: Date.now },
    updated_at: Date
});
//Schema: Feedback badges
var FeedbackBadgeSchema = new Schema({
    badge: {type: ObjectId, ref: 'Badge'},
    skill_inc: {type: Number}
});
//Schema: Feedback
var FeedbackSchema = new Schema({
    text: String,
    badges: [FeedbackBadgeSchema],
    /* MCQs */
    selected_options: [{type: ObjectId, ref: 'Option'}],
    /* Fill in the blanks */
    fill_id: {type: ObjectId, ref: 'Fill'},
    fill_items: [String],
    /* Shown to users */
    users: [{type: ObjectId, ref: 'User'}]
});
//Schema: Block
var BlockSchema = new Schema({
    order: {type: Number, index: true, default: 1},
    slug: {type: String, index: true, unique: true, sparse: true},
    type: {type: String, required: true, enum: ['text', 'button', 'divider', 'toggle_list', 'image', 'link', 'video', 'audio', 'file', 'gif', 'mcq', 'fill', 'match', 'response', 'list', 'container', 'grid', 'comic', 'embed']},
    /* Course */
    course: {type: ObjectId, ref: 'Course'},
    is_active: {type: Boolean, default: true},
    is_required: {type: Boolean, default: false},
    is_hidden: {type: Boolean, default: false}, //Is hidden from learners
    /* Text */
    title: String,
    summary: String,
    text: String,
    images: [String],
    /* Button */
    button: {
        url: String,
        block: Number, //Jump to block
        is_new_tab: {type: Boolean, default: true}
    },
    /* Divider */
    divider: {
        type: {type: String, enum: ['empty', 'animation', 'music', 'game'], default: 'empty'},
        time: Number, //Time in seconds
        name: String //Name of animation, music or game
    },
    /* Image, Comic */
    image: {
        m: String,
        l: String
    },
    bound: Number,
    /* File, Audio, Video */
    file: {
        size: Number,
        icon: String,
        ext: String
    },
    /* Link | File | Embed */
    provider: {
        name: String,
        url: String,
        favicon: String
    },
    embed: {
        code: String,
        kind: String,
        width: Number,
        height: Number
    },
    publish_date: Date,
    /* GIF */
    gif: {
        embed: String,
        url: String,
        width: String,
        height: String
    },
    /* MCQs | Image MCQs */
    mcqs: [OptionSchema],
    is_multiple: {type: Boolean, default: false},
    /* Fill in the blanks */
    fills: [FillSchema],
    /* Match the following */
    options: [OptionSchema],
    /* Response */
    response_type: {type: String, enum: ['text', 'audio', 'video', 'canvas', 'file']},
    responses: [ResponseSchema],
    keywords: [String],
    /* Toggle_List, List, Container or Grid cells */
    items: [ItemSchema],
    /* Container */
    container: ObjectId,
    /* Theme */
    theme: String,
    art: {
        m: String,
        l: String,
        bound: Number
    },
    size: {
        width: {type: Number, default: 100},
        margin: {type: Number, default: 0}
    },
    /* Feedback */
    feedbacks: [FeedbackSchema],
    /* Extra */
    alt_text: String,
    ref_url: String,
    extra: String,
    /* Comments */
    has_discussion: {type: Boolean, default: false},
    is_restricted: {type: Boolean, default: false},
    is_collapsed: {type: Boolean, default: false},
    comments: [CommentSchema],
    /* Viewers */
    viewers: [ViewerSchema],
    /* User */
    creator: {type: ObjectId, ref:'User'},
    created_at: { type: Date, default: Date.now },
    updated_at: Date
});
// Optional
BlockSchema.add({children: [BlockSchema]});
//Schema: Note
var NoteSchema = new Schema({
    text: {type: String, required: true},
    order: Number,
    summary: String,
    /* Reference */
    block: {type: ObjectId, ref: 'Block'},
    /* User */
    creator: {type: ObjectId, ref: 'User'},
    created_at: {type: Date, default: Date.now},
    updated_at: Date
});
//Schema: Chat
var ChatSchema = new Schema({
    text: String,
    /* Is recent chat */
    is_recent: Boolean,
    /* Is system generated */
    is_system: Boolean,
    /* User */
    creator: {type: ObjectId, ref: 'User'},
    created_at: {type: Date, default: Date.now}
});
//Schema: Message
var MessageSchema = new Schema({
    user: {type: ObjectId, ref: 'User'},
    /* Chats */
    chats: [ChatSchema],
    /* Chat count */
    count: Number,
    /* Archive */
    is_archived: {type: Boolean, default: false},
    /* User */
    creator: {type: ObjectId, ref: 'User'},
    created_at: {type: Date, default: Date.now},
    updated_at: Date
});

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
//Create the model and expose it to app
module.exports.Member = mongoose.model('Member', MemberSchema);
module.exports.Learner = mongoose.model('Learner', LearnerSchema);
module.exports.Viewer = mongoose.model('Viewer', ViewerSchema);
module.exports.Course = mongoose.model('Course', CourseSchema);
module.exports.Badge = mongoose.model('Badge', BadgeSchema);
module.exports.Attachment = mongoose.model('Attachment', AttachmentSchema);
module.exports.Response = mongoose.model('Response', ResponseSchema);
module.exports.Option = mongoose.model('Option', OptionSchema);
module.exports.Fill = mongoose.model('Fill', FillSchema);
module.exports.Item = mongoose.model('Item', ItemSchema);
module.exports.Comment = mongoose.model('Comment', CommentSchema);
module.exports.FeedbackBadge = mongoose.model('FeedbackBadge', FeedbackBadgeSchema);
module.exports.Feedback = mongoose.model('Feedback', FeedbackSchema);
module.exports.Block = mongoose.model('Block', BlockSchema);
module.exports.Note = mongoose.model('Note', NoteSchema);
module.exports.Chat = mongoose.model('Chat', ChatSchema);
module.exports.Message = mongoose.model('Message', MessageSchema);
module.exports.Pizza = mongoose.model('Pizza', PizzaSchema);
