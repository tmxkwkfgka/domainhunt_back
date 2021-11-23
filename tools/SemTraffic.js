const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const cookiesFilePath = './cookies.json';

async function start(domainNames) {
  console.log('semtraffic start!', domainNames);
  let domainTraffics = {};
  this.browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: ['--proxy-server="direct://"', '--proxy-bypass-list=*'],
  });
  let page = await this.browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
  );

  //page.setUserAgent("Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3563.0 Safari/537.36")
  await page.setDefaultNavigationTimeout(60000);

  const previousSession = fs.existsSync(cookiesFilePath);

  if (previousSession) {
    // If file exist load the cookies
    const cookiesString = fs.readFileSync(cookiesFilePath);
    const parsedCookies = JSON.parse(cookiesString);
    if (parsedCookies.length !== 0) {
      for (let cookie of parsedCookies) {
        await page.setCookie(cookie);
      }
      console.log('Session has been loaded in the browser');
    }
  } else {
    await login(page);
    // await page.type('input.srf-searchbar__form__input', 'macaroonoriginal.com');
    // let searchButton = await page.$('button.srf-searchbar__form__search');
    // await searchButton.click();
  }
  // 나중에 온 로드로 수정
  // domainnames를 array로 받음 그것에 대한 결과를 리턴해줌
  //domainNames = ['toondoo.com', 'kemanime.com'];

  for (let domainName of domainNames) {
    let traffics = await getDataProcess(page, domainName);
    domainTraffics[domainName] = traffics;
  }

  //console.log('result = ', domainTraffics);
  await this.browser.close();
  return domainTraffics;
}

async function getDataProcess(page, domainName) {
  try {
    await page.goto(
      `https://www.semrush.com/analytics/overview/?q=${domainName}&searchType=domain`,
    );
    let timeOut = await Promise.race([
      page.waitForSelector('g.recharts-cartesian-grid'),
      new Promise((resolve) => {
        setTimeout(() => {
          return resolve(true);
        }, 4000);
      }),
    ]);

    console.log('timeOut        = ', timeOut);
    if (timeOut === true) {
      console.log('timeOut = true');
      return {};
    }

    // div[data-at="do-traffic-trend"] > div > div[class="recharts-responsive-container"]
    // 안에 차트모양 이걸 기다려야 뒤에서 getboundingrect에서 오류가 안남
    let trafficFindTimeOut = await Promise.race([
      page.waitForSelector(
        'div[data-at="do-traffic-trend"] > div[class^="no_data"]',
      ),
      page.waitForSelector(
        'div[data-at="do-traffic-trend"] > div > div > div[class="recharts-responsive-container"]',
      ),
      new Promise((resolve) => {
        setTimeout(() => {
          return resolve(true);
        }, 4000);
      }),
    ]);

    if (trafficFindTimeOut === true) {
      console.log('trafficFindTimeOut = true');
      return {};
    }

    let hasData = await page.evaluate(() => {
      let noData = document.querySelector(
        'div[data-at="do-traffic-trend"] > div[class^="no_data"]',
      );
      if (noData) {
        console.log('nodata = ', noData);
        return false;
      }
      let trafficDiv = document.querySelector(
        'div[data-at="do-traffic-trend"]',
      );
      if (!trafficDiv) {
        console.log('traffic div 없음 ');
        return {};
      }
      let gra = trafficDiv.querySelector('g.recharts-cartesian-grid');
      window.scrollTo(
        gra.getBoundingClientRect().left,
        gra.getBoundingClientRect().top - 100,
      );

      let allButton = document.querySelector("button[data-value='all']");
      allButton.click();
      return true;
    });

    // semrush에 데이터가 없음 걸러야함
    if (hasData === false) {
      return {};
    }

    // do traffic trend 안에이ㅆ는 g charts를 가져와야함
    //let gr = await page.$('g.recharts-cartesian-grid');
    const rect = await page.evaluate(() => {
      let trafficDiv = document.querySelector(
        'div[data-at="do-traffic-trend"]',
      );
      let gr = trafficDiv.querySelector('g.recharts-cartesian-grid');
      const { top, left, bottom, right } = gr.getBoundingClientRect();
      //window.scrollTo(left, top - 100);
      return { top, left, bottom, right };
    });

    let traffics = {};
    traffics.yearMonth = [];
    for (let m = 0; m < 120; m++) {
      console.log('move before');
      await page.mouse.move(rect.left + 5 * m, rect.bottom - 10);

      let chartData = await page.evaluate(() => {
        let trafficDiv = document.querySelector(
          'div[data-at="do-traffic-trend"]',
        );
        let rows = document.querySelectorAll(
          "div[class^='tooltip.module__row']",
        );
        let cap = trafficDiv.querySelector(
          "div[class^='tooltip.module__caption']",
        );
        let chartDataObj = {};

        let yearMonth = null;

        if (cap && new Date(cap.innerText) && !isNaN(new Date(cap.innerText))) {
          console.log('caps0 innertext = ', cap.innerText, cap);
          yearMonth =
            new Date(cap.innerText).getUTCFullYear() +
            '.' +
            (new Date(cap.innerText).getUTCMonth() + 1);
        }
        console.log(yearMonth);

        for (let i = 0; i < rows.length; i++) {
          //console.log(rows[i].innerText.split("\n"));
          //console.log(rows[i].innerText);
          let pair = rows[i].innerText.split('\n');
          if (pair && pair[0] && pair[1]) chartDataObj[pair[0]] = pair[1];
        }
        return { yearMonth, chartDataObj: JSON.stringify(chartDataObj) };
      }); //evaluate

      console.log(chartData);
      if (!chartData.yearMonth) {
        // break;
      }

      if (chartData.yearMonth) {
        traffics.yearMonth.push(chartData.yearMonth);
        let chartDataObj = JSON.parse(chartData.chartDataObj);
        Object.keys(chartDataObj).forEach((key) => {
          if (traffics[key]) {
            traffics[key].push(chartDataObj[key]);
          } else {
            traffics[key] = [chartDataObj[key]];
          }
        });
      }
    } // for loop

    //console.log(traffics);
    return traffics;
  } catch (err) {
    console.log('getDataProcess error ', err);
    return {};
  }
}

async function login(page) {
  await page.goto(
    'https://www.semrush.com/login/?src=header&redirect_to=%2F%3Fl%3Den%261609652991',
  );
  await page.waitForSelector("input[type='email']");

  await page.type("input[type='email']", 'tmxkwkfgka1@naver.com');
  await page.type("input[type='password']", 'folds1323@');
  let loginButton = await page.$('button[data-ga-label="login"]');

  await loginButton.click();

  const cookiesFilePath = 'cookies.json';
  // Save Session Cookies
  const cookiesObject = await page.cookies();
  // Write cookies to temp file to be used in other profile pages
  fs.writeFile(cookiesFilePath, JSON.stringify(cookiesObject), function (err) {
    if (err) {
      console.log('The file could not be written.', err);
    }
    console.log('Session has been successfully saved');
  });
}

module.exports = {
  semTraffic: start,
};
