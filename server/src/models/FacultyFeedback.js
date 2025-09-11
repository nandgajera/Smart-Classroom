const mongoose = require('mongoose');

const facultyFeedbackSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  feedbackDate: {
    type: Date,
    default: Date.now
  },
  ratings: {
    // Subject Knowledge (1-5)
    subjectKnowledge: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Teaching Methodology (1-5)
    teachingMethodology: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Communication Skills (1-5)
    communicationSkills: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Preparation and Organization (1-5)
    preparationOrganization: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Interaction with Students (1-5)
    studentInteraction: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Punctuality (1-5)
    punctuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Use of Technology/Teaching Aids (1-5)
    technologyUse: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Assignment and Evaluation (1-5)
    assignmentEvaluation: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Overall Satisfaction (1-5)
    overallSatisfaction: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  comments: {
    positiveAspects: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    areasForImprovement: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    suggestions: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    additionalComments: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'processed'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

// Indexes
facultyFeedbackSchema.index({ faculty: 1, academicYear: 1, semester: 1 });
facultyFeedbackSchema.index({ subject: 1, academicYear: 1 });
facultyFeedbackSchema.index({ student: 1, faculty: 1, subject: 1 }, { unique: true });

// Virtual for average rating
facultyFeedbackSchema.virtual('averageRating').get(function() {
  const ratings = this.ratings;
  const ratingValues = [
    ratings.subjectKnowledge,
    ratings.teachingMethodology,
    ratings.communicationSkills,
    ratings.preparationOrganization,
    ratings.studentInteraction,
    ratings.punctuality,
    ratings.technologyUse,
    ratings.assignmentEvaluation,
    ratings.overallSatisfaction
  ];
  
  const total = ratingValues.reduce((sum, rating) => sum + rating, 0);
  return Math.round((total / ratingValues.length) * 100) / 100; // Round to 2 decimal places
});

// Static method to get faculty performance summary
facultyFeedbackSchema.statics.getFacultyPerformance = async function(facultyId, academicYear, semester) {
  const pipeline = [
    {
      $match: {
        faculty: new mongoose.Types.ObjectId(facultyId),
        academicYear,
        ...(semester && { semester }),
        status: { $in: ['submitted', 'reviewed', 'processed'] }
      }
    },
    {
      $group: {
        _id: '$faculty',
        totalResponses: { $sum: 1 },
        avgSubjectKnowledge: { $avg: '$ratings.subjectKnowledge' },
        avgTeachingMethodology: { $avg: '$ratings.teachingMethodology' },
        avgCommunicationSkills: { $avg: '$ratings.communicationSkills' },
        avgPreparationOrganization: { $avg: '$ratings.preparationOrganization' },
        avgStudentInteraction: { $avg: '$ratings.studentInteraction' },
        avgPunctuality: { $avg: '$ratings.punctuality' },
        avgTechnologyUse: { $avg: '$ratings.technologyUse' },
        avgAssignmentEvaluation: { $avg: '$ratings.assignmentEvaluation' },
        avgOverallSatisfaction: { $avg: '$ratings.overallSatisfaction' }
      }
    },
    {
      $addFields: {
        overallAverage: {
          $avg: [
            '$avgSubjectKnowledge',
            '$avgTeachingMethodology',
            '$avgCommunicationSkills',
            '$avgPreparationOrganization',
            '$avgStudentInteraction',
            '$avgPunctuality',
            '$avgTechnologyUse',
            '$avgAssignmentEvaluation',
            '$avgOverallSatisfaction'
          ]
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || null;
};

// Static method to get subject-wise performance
facultyFeedbackSchema.statics.getSubjectWisePerformance = async function(facultyId, academicYear) {
  const pipeline = [
    {
      $match: {
        faculty: new mongoose.Types.ObjectId(facultyId),
        academicYear,
        status: { $in: ['submitted', 'reviewed', 'processed'] }
      }
    },
    {
      $group: {
        _id: '$subject',
        totalResponses: { $sum: 1 },
        averageRating: {
          $avg: {
            $avg: [
              '$ratings.subjectKnowledge',
              '$ratings.teachingMethodology',
              '$ratings.communicationSkills',
              '$ratings.preparationOrganization',
              '$ratings.studentInteraction',
              '$ratings.punctuality',
              '$ratings.technologyUse',
              '$ratings.assignmentEvaluation',
              '$ratings.overallSatisfaction'
            ]
          }
        },
        avgOverallSatisfaction: { $avg: '$ratings.overallSatisfaction' }
      }
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subjectInfo'
      }
    },
    {
      $unwind: '$subjectInfo'
    },
    {
      $project: {
        subjectName: '$subjectInfo.name',
        subjectCode: '$subjectInfo.code',
        totalResponses: 1,
        averageRating: { $round: ['$averageRating', 2] },
        avgOverallSatisfaction: { $round: ['$avgOverallSatisfaction', 2] }
      }
    },
    {
      $sort: { averageRating: -1 }
    }
  ];

  return await this.aggregate(pipeline);
};

// Static method to get rating distribution
facultyFeedbackSchema.statics.getRatingDistribution = async function(facultyId, academicYear) {
  const pipeline = [
    {
      $match: {
        faculty: new mongoose.Types.ObjectId(facultyId),
        academicYear,
        status: { $in: ['submitted', 'reviewed', 'processed'] }
      }
    },
    {
      $project: {
        overallRating: {
          $round: [
            {
              $avg: [
                '$ratings.subjectKnowledge',
                '$ratings.teachingMethodology',
                '$ratings.communicationSkills',
                '$ratings.preparationOrganization',
                '$ratings.studentInteraction',
                '$ratings.punctuality',
                '$ratings.technologyUse',
                '$ratings.assignmentEvaluation',
                '$ratings.overallSatisfaction'
              ]
            },
            0
          ]
        }
      }
    },
    {
      $group: {
        _id: '$overallRating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  // Initialize distribution object
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  result.forEach(item => {
    distribution[item._id] = item.count;
  });

  return distribution;
};

module.exports = mongoose.model('FacultyFeedback', facultyFeedbackSchema);
