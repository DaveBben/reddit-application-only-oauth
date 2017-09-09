const dataStore = window.localStorage;
const clientID = ''; //IMPORTANT - THIS NEEDS TO BE YOUR CLIENT ID FROM YOUR APP
const subreddits = ['android'];

/**
 * Gets an access token to use for query.
 */
function getAccessToken() {
  $.ajax({
    type: 'post',
    url: 'https://www.reddit.com/api/v1/access_token',
    dataType: 'json',
    headers: {
      Authorization: `Basic ${btoa(`${clientID}:` + '')}`,
    },
    data: { grant_type: 'https://oauth.reddit.com/grants/installed_client', device_id: dataStore.getItem('deviceID') },
    success(data) {
      if (data.access_token) {
        dataStore.setItem('accessToken', data.access_token);
        dataStore.setItem('expires', new Date().addHours((data.expires_in) / 3600));
        grabStories();
      }
    },
    error(err) {
      console.log(err);
    },
  });
}

/**
 * Queries the reddit api for a specific subreddit
 * @param {* string - subrredit name} subreddit 
 * @param {*function - callback function} callback 
 */
function query(subreddit, callback) {
  const url = `https://oauth.reddit.com/r/${subreddit}/new`;
  $.ajax({
    type: 'get',
    url,
    dataType: 'json',
    headers: {
      Authorization: `Bearer ${dataStore.getItem('accessToken')}`,
    },
    success(data) {
      callback(data);
    },
    error(err) {
      console.log(err);
    },
  });
}

/**
 * Write the data to page
 * @param {*} data - json object
 */
function queryCallback(data) {
  const list = document.createElement('ul');
  const posts = data.data.children;
  posts.forEach((element) => {
    const item = document.createElement('li');
    item.innerHTML = element.data.title;
    list.appendChild(item);
  });
  document.body.appendChild(list);
}

/**
 * Token is valid if it exists and expiration time
 * is greater than 5 minutes.
 *
 */
function validToken() {
  if (!dataStore.getItem('accessToken')) {
    return false;
  }

  const currentDate = new Date();
  const expires = new Date(dataStore.getItem('expires'));
  const difference = (expires.getTime() - currentDate.getTime());
  const minutesDifference = Math.ceil(difference / (1000 * 60)); // minutes difference
  if (minutesDifference < 5) {
    return false;
  }

  return true;
}

/**
 * This functions checks to see if the token is valid,
 * then queries each subreddit in the array.
 */
function grabStories() {
  if (!validToken()) {
    getAccessToken();
  } else {
    for (const i of subreddits) {
      query(i, queryCallback);
    }
  }
}


// the closest thing to generating a truly random UID
// source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function getRandomID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * When the page loads we call this function.
 * This checks to see if a device id exists in local sotrage
 */
function init() {
  if (!dataStore.getItem('deviceID')) {
    dataStore.setItem('deviceID', getRandomID());
    console.log('Created new deivce ID');
  }
  grabStories();
}

// Adding hours to the current date
// source: https://stackoverflow.com/questions/1050720/adding-hours-to-javascript-date-object
Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
};

// Calling this on page load
init();
