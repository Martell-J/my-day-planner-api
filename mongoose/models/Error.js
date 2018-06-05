"use strict";

module.exports = (mongoose) => {

  const ErrorSchema = new mongoose.Schema({
    "userid": { "type": Number, "required": false },
    "time": { "type": Date, "required": true, "default": Date.now },
    "details": { "type": mongoose.Schema.Types.Mixed, "required": false, "default": {} },
    "error": { "type": mongoose.Schema.Types.Mixed, "required": true, "default": {} },
  }, { "versionKey": false, "strict": true, "collection": "errors", "minimize": false });

  return mongoose.model("Error", ErrorSchema);

};
