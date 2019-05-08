"use strict";

module.exports = (mongoose) => {

  const LogSchema = new mongoose.Schema({
    "userid": { "type": Number, "required": false },
    "time": { "type": Date, "required": true, "default": Date.now },
    "details": { "type": mongoose.Schema.Types.Mixed, "required": false, "default": {} },
    "log": { "type": mongoose.Schema.Types.Mixed, "required": true, "default": {} },
  }, { "versionKey": false, "strict": true, "collection": "logs", "minimize": false });

  return mongoose.model("Log", LogSchema);

};
