const mongoose = require('mongoose');


// 리뷰 스키마

const reviewSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  reviewText: {
    type: String,
    required: true
  },
  createdOn: {
    type: Date,
    default: Date.now
  }
});



// 영업시간 스키마
const openingTimeSchema = new mongoose.Schema({
  days: {
    type: String,
    required: true
  },
  opening: String,
  closing: String,
  closed: {
    type: Boolean,
    required: true
  }
});


// 장소 스키마
const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  address: String,

  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  facilities: [String],

  coords: {
    type: {
      type: String
    },
    coordinates: [Number]
  },

  openingTimes: [openingTimeSchema],

  reviews: [reviewSchema]
});


// 위치 검색용 인덱스
locationSchema.index({ coords: '2dsphere' });


// 모델 생성
mongoose.model('Location', locationSchema);