const mongoose = require('mongoose');

const dbPassword = process.env.MONGODB_PASSWORD;

const dbURI =
  `mongodb+srv://ysi:${encodeURIComponent(dbPassword)}@cluster0.c0omuo0.mongodb.net/Loc8r`;

mongoose.connect(dbURI);

// MongoDB 연결 성공
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB Atlas - Loc8r');
});

// MongoDB 연결 오류
mongoose.connection.on('error', err => {
  console.log(`Mongoose connection error: ${err}`);
});

// MongoDB 연결 종료
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Mongoose 연결을 정상적으로 종료하는 함수
const gracefulShutdown = (msg, callback) => {
  mongoose.connection.close(() => {
    console.log(`Mongoose disconnected through ${msg}`);
    callback();
  });
};

// nodemon 재시작 시
process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart', () => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

// 애플리케이션 종료 시
process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => {
    process.exit(0);
  });
});

// Heroku 애플리케이션 종료 시
process.on('SIGTERM', () => {
  gracefulShutdown('Heroku app shutdown', () => {
    process.exit(0);
  });
});

// Location 모델 불러오기
require('./locations');