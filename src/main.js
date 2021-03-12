function getCookieValue(key){
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(key + '='))
      .split('=')[1]
};

async function getSevenPostTimestampsAfterIndex(idx, url) {
    if(!url.startsWith("https://www.xing.com/communities/forums")){
        console.error("Current Page needs to start with 'https://www.xing.com/communities/forums'!");
        alert("Current Page needs to start with 'https://www.xing.com/communities/forums'!");
        return;
    }
    const fullUrl = url + "/endless.json?offset=" + idx;
    const timestamps = await fetch(fullUrl, {
      "headers": {
        "accept": "text/javascript, text/html, application/xml, text/xml, */*",
        "accept-language": "en-US,en;q=0.9,en-GB;q=0.8,de;q=0.7",
        "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-csrf-token": getCookieValue('xing_csrf_token'),
        "x-requested-with": "XMLHttpRequest"
      },
      "referrer": "https://www.xing.com/communities/forums/100004482",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(resp => {
        return reader = resp.text().then(text => {
            const matches = text.match(/datetime=\\".{0,25}\\"/g);
            return matches === null ? [] : matches;
        })
    })
    return timestamps.map(str => str.substring(11,str.length - 2));
};

async function _getLastPostTimestamps(numberOfPosts, url){
    if(typeof _=="undefined"){
        console.error("Need to import Lodash first!");
        alert("Need to import Lodash first!");
        return;
    }
    const fetches = [];
    const batches = numberOfPosts / 1200;
    let flatResults = [];
    for(let batchIdx = 0; batchIdx < batches; batchIdx++){
        for(let i = batchIdx * 1200; i < (batchIdx + 1) * 1200; i += 7){
            fetches.push(getSevenPostTimestampsAfterIndex(i, url));
        }
        const promiseResults = await Promise.all(fetches);
        flatResults = flatResults.concat(promiseResults.flat(1));
    }
    return flatResults;
}

let getLastPostTimestamps = _.memoize(_getLastPostTimestamps);

async function displayLastPostDates(numberOfPosts) {
    const dateFormatFn = (date) => date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    return await displayLastPostTimestampsWithFormat(numberOfPosts, dateFormatFn);
}

async function displayLastPostTimeStamps(numberOfPosts) {
    const dateFormatFn = (date) => date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":00";
    return await displayLastPostTimestampsWithFormat(numberOfPosts, dateFormatFn);
}

async function displayLastPostTimeOnly(numberOfPosts) {
    const dateFormatFn = (date) =>  date.getHours() + ":00";
    return await displayLastPostTimestampsWithFormat(numberOfPosts, dateFormatFn);
}

async function displayLastPostDayOfWeek(numberOfPosts) {
    const dateFormatFn = (date) =>  date.getDay();
    return await displayLastPostTimestampsWithFormat(numberOfPosts, dateFormatFn);
}

function countOcurrencesReductionFn (acc, curr) {
     if (typeof acc[curr] == 'undefined') {
       acc[curr] = 1;
     } else {
       acc[curr] += 1;
     }

     return acc;
}

async function displayLastPostTimestampsWithFormat(numberOfPosts, dateFormatFn) {
    const timestamps = await getLastPostTimestamps(numberOfPosts, window.location.href);
    const dates = timestamps
            .map((timestamp) => new Date(timestamp))
            //TODO: Convert to german time?
            .map(dateFormatFn);
    const dateToCountDict = dates.reduce(countOcurrencesReductionFn, {});
    let result = '';
    Object.keys(dateToCountDict).forEach(key => result += key + '\t' + dateToCountDict[key] + '\n');
    console.warn(result);
}