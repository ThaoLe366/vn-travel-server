const mongoose = require('mongoose');
const { formatTimeUTC } = require('../utils/Timezone');

const announcementSchema = mongoose.Schema({
  receiver: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'users',
    },
  ],
  type: {
    type: String,
    require: true,
  },
  creator: {
    type: mongoose.Types.ObjectId,
    ref: 'users',
  },
  title: {
    type: String,
    require: true,
  },
  content: {
    type: String,
    require: true,
  },
  unread: {
    type: Boolean,
    default: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
  image: {
    type: String,
    require: false,
  },
  plan: {
    type: mongoose.Types.ObjectId,
    ref: 'plans',
  },
  engContent: {
    type: String,
    default: '',
  },
  engTitle: {
    type: String,
    default: '',
  },
});

announcementSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});
exports.Announcement = mongoose.model('announcements', announcementSchema);
