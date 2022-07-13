const mongoose = require('mongoose');
const { formatTimeUTC } = require('../utils/Timezone');

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  color: {
    type: String,
    default: '#FFF',
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
  engName: {
    type: String,
    default: '',
  },
});
categorySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});
exports.Category = mongoose.model('categories', categorySchema);
