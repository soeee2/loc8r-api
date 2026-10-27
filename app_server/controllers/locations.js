
/* GET 'home' page */

const request = require('request');

// API 서버 설정
const apiOptions = {
  server: 'http://localhost:3000'
};

if (process.env.NODE_ENV === 'production') {
  apiOptions.server = 'https://yourapi.com';
}


// 거리 단위 변환 함수 (12-2)
const formatDistance = (distance) => {
  let thisDistance = 0;
  let unit = 'm';

  if (distance > 1000) {
    thisDistance = parseFloat(distance / 1000).toFixed(1);
    unit = 'km';
  } else {
    thisDistance = Math.floor(distance);
  }

  return thisDistance + unit;
};


// 홈페이지 렌더링 함수 (12-1, 12-3)
const renderHomepage = (req, res, responseBody) => {
  let message = null;

  if (!Array.isArray(responseBody)) {
    message = 'API lookup error';
    responseBody = [];
  } else if (!responseBody.length) {
    message = 'No places found nearby';
  }

  res.render('locations-list', {
    title: 'Loc8r - find a place to work with wifi',

    pageHeader: {
      title: 'Loc8r 2024810064 유소이',
      strapline: 'Find places to work with wifi near you!'
    },

    sidebar: 'Looking for wifi and a seat? Loc8r helps you find places to work when out and about. Perhaps with coffee, cake or a pint? Let Loc8r help you find the place you\'re looking for.',

    locations: responseBody,
    message
  });
};


// REST API에서 매장 목록 가져오기 (12-1, 12-2, 12-3)
const homelist = (req, res) => {
  const path = '/api/locations';

  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: true,
    qs: {
      lng: 126.964062,
      lat: 37.468769,
      maxDistance: 200000
    }
  };

  request(
    requestOptions,
    (err, response, body) => {

      if (err || !response || response.statusCode !== 200) {
        console.log('API 목록 조회 오류:', err || response?.statusCode);
        return renderHomepage(req, res, null);
      }

      if (!Array.isArray(body)) {
        return renderHomepage(req, res, null);
      }

      const data = body.map((item) => {
        item.distance = formatDistance(item.distance);
        return item;
      });

      renderHomepage(req, res, data);
    }
  );
};


// 매장 상세 페이지 렌더링 함수 (13-1)
const renderDetailPage = (req, res, location) => {
  res.render('location-info', {
    title: location.name,

    pageHeader: {
      title: location.name
    },

    sidebar: {
      context: 'is on Loc8r because it has accessible wifi and space to sit down with your laptop and get some work done.',
      callToAction: 'If you\'ve been and you like it - or if you don\'t - please leave a review to help other people just like you.'
    },

    location
  });
};


// ==================================================
// 14-1 추가: 리뷰 작성 페이지 렌더링 함수
// ==================================================

const renderReviewForm = (req, res, {name}) => {
  res.render('location-review-form', {
    title: `Review ${name} on Loc8r`,
    pageHeader: {
      title: `Review ${name}`
    },
    error: req.query.err
  });
};



// ==================================================
// 14-1 추가: 매장 상세정보를 가져오는 공통 API 함수
// ==================================================

const getLocationInfo = (req, res, callback) => {

  const path = `/api/locations/${req.params.locationid}`;

  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {}
  };

  request(
    requestOptions,
    (err, response, body) => {

      // API 요청 실패 처리
      if (err || !response) {
        return showError(req, res, 500);
      }

      const statusCode = response.statusCode;

      if (statusCode === 200) {

        const data = body;

        // 좌표 데이터 존재 여부 확인
        if (!data || !data.coords) {
          return showError(req, res, 500);
        }

        // 배열과 GeoJSON 객체 형식 모두 처리
        const coordinates = Array.isArray(data.coords)
          ? data.coords
          : data.coords.coordinates;

        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          return showError(req, res, 500);
        }

        // 좌표 배열을 객체로 변환
        data.coords = {
          lng: coordinates[0],
          lat: coordinates[1]
        };

        // 매장 정보를 전달하며 콜백 실행
        callback(req, res, data);

      } else {
        showError(req, res, statusCode);
      }
    }
  );
};



// ==================================================
// 14-1 수정: 매장 상세 페이지 컨트롤러
// ==================================================
const locationInfo = (req, res) => {

  getLocationInfo(req, res,
    (req, res, responseData) => {
      renderDetailPage(req, res, responseData);
    }
  );

};


// ==================================================
// 14-1 수정: 리뷰 작성 페이지 컨트롤러
// ==================================================
const addReview = (req, res) => {

  getLocationInfo(req, res,
    (req, res, responseData) => {
      renderReviewForm(req, res, responseData);
    }
  );

};


// API 오류 페이지 출력
const showError = (req, res, status) => {

  let title = '';
  let content = '';

  if (status === 404) {
    title = '404, page not found';
    content = "Oh dear. Looks like you can't find this page. Sorry.";
  } else {
    title = `${status}, something's gone wrong`;
    content = 'Something, somewhere, has gone just a little bit wrong.';
  }

  res.status(status);

  res.render('generic-text', {
    title,
    content
  });
};



const doAddReview = (req, res) => {
  const locationid = req.params.locationid;
  const path = `/api/locations/${locationid}/reviews`;

  const postdata = {
    author: req.body.name,
    rating: parseInt(req.body.rating, 10),
    reviewText: req.body.review
  };

  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'POST',
    json: postdata
  };

  request(
    requestOptions,
    (err, response, body) => {
      if (err || !response) {
        return showError(req, res, 500);
      }

      const statusCode = response.statusCode;

      if (statusCode === 201) {
        res.redirect(`/location/${locationid}`);
      } else if (
        statusCode === 400 &&
        body?.name === 'ValidationError'
      ) {
        res.redirect(`/location/${locationid}/review/new?err=val`);
      } else {
       showError(req, res, statusCode);
      }
    }
  );
};



// 컨트롤러 내보내기
module.exports = {
  homelist,
  locationInfo,
  addReview,
  doAddReview
};
