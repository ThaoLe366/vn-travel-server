const mongoose = require('mongoose');
const { formatTimeUTC } = require('../utils/Timezone');

const explorerSchema = new mongoose.Schema({
  title: {
    type: String,
    default: null,
    require: true,
  },
  engTitle: {
    type: String,
    default: '',
    require: true,
  },
  description: {
    type: String,
    default: null,
    require: true,
  },
  engDescription: {
    type: String,
    default: '',
    require: true,
  },
  banner: {
    type: String,
    default: '',
    require: true,
  },
  tags: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'tags',
    },
  ],
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
});
explorerSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});
module.exports = mongoose.model('explorers', explorerSchema);
