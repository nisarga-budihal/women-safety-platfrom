const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'resolved', 'cancelled'],
    default: 'pending'
  },
  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  volunteerLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  description: {
    type: String,
    maxlength: 500,
    default: 'Emergency SOS Alert'
  },
  emergencyType: {
    type: String,
    enum: ['harassment', 'stalking', 'assault', 'accident', 'medical', 'other'],
    default: 'other'
  },
  locationHistory: [{
    coordinates: {
      type: [Number],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  chatMessages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  notifiedVolunteers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  responseTime: {
    type: Number, // in seconds
    default: null
  },
  resolvedAt: Date,
  cancelledAt: Date,
  cancelReason: String
}, {
  timestamps: true
});

// Indexes
emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ status: 1 });
emergencySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Emergency', emergencySchema);
