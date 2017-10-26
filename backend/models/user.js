var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
// var bcrypt = require('bcrypt-nodejs');


var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        index: { unique: true },
        required: true,
        lowercase: true
    },
    password: {
        type: String,
    }
});


//passport-local-mongoose already hashes things.. could uninstall bcrypt...
// UserSchema.methods.generateHash = function(password) {
//     return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
// };
//
// UserSchema.methods.validPassword = function(password) {
//     return bcrypt.compareSync(password, this.local.password);
// };


UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);