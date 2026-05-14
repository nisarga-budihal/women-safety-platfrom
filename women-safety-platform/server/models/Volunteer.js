const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  idVerification: {
    documentType: {
      type: String,
      enum: ['aadhar', 'pan', 'driving_license', 'passport', 'voter_id'],
      required: true
    },
    documentNumber: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verifiedAt: Date,
    rejectionReason: String
  },
  availability: {
    type: Boolean,
    default: false
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  responseCount: {
    type: Number,
    default: 0
  },
  avgResponseTime: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  specializations: [{
    type: String,
    enum: ['first_aid', 'self_defense', 'counseling', 'legal_aid', 'transportation', 'general']
  }],
  bio: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for geospatial queries — find nearby volunteers
volunteerSchema.index({ location: '2dsphere' });
volunteerSchema.index({ availability: 1, 'idVerification.status': 1 });

module.exports = mongoose.model('Volunteer', volunteerSchema);
