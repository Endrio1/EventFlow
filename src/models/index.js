// Exportar modelos Mongoose (projeto migrado para MongoDB)
const User = require('./User');
const Event = require('./Event');
const Enrollment = require('./Enrollment');
const Feedback = require('./Feedback');
const Activity = require('./Activity');

module.exports = {
  User,
  Event,
  Enrollment,
  Feedback,
  Activity
};
