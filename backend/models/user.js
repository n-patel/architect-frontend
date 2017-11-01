"use strict";
var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var UserSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    username: {
        type: String,
        index: { unique: true },
        required: true,
        lowercase: true
    },
    password: {
        type: String,
    },
    date: Date,
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
