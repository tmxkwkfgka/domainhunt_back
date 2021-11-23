const puppeteer = require('puppeteer');
const fs = require('fs');

('use strict');
class WayBackShot {
  contructor() {
    this.browser = null;
    this.page = null;
  }

  async initBrowser() {
    this.browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      args: ['--proxy-server="direct://"', '--proxy-bypass-list=*'],
    });
    this.page = await this.browser.newPage();
    await this.page.setDefaultNavigationTimeout(60000);
  }

  async shotWithInfo(domainInfo) {
    try {
      let yearMonth = domainInfo.maxYearMonth || '202005';
      let filePath = `screenshot/${domainInfo.name}.png`;

      await this.page.goto(
        `https://web.archive.org/web/${yearMonth}20043810/http://${domainInfo.name}/`,
        //{ waitUntil: 'networkidle2' },
        { waitUntil: 'domcontentloaded' },
      );
      await this.page.screenshot({
        path: filePath,
        fullPage: true,
      });
      return { path: filePath };
    } catch (shotErr) {
      console.log(shotErr);
      return null;
    }
  }

  async shotWithName(domainName) {
    try {
      let yearMonthArray = ['200505', '201005', '201505', '202005', '202105'];

      for (let yearMonth of yearMonthArray) {
        let folderPath = `screenshot/${domainName}`;
        let filePath = `${folderPath}/${domainName}_${yearMonth}.png`;

        await this.page.goto(
          `https://web.archive.org/web/${yearMonth}20043810/http://${domainName}/`,
          //{ waitUntil: 'networkidle2' },
          { waitUntil: 'domcontentloaded' },
        );
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
        }

        await this.page.screenshot({
          path: filePath,
          fullPage: true,
        });
      }

      return { path: domainName };
    } catch (shotErr) {
      console.log(shotErr);
      return null;
    }
  }

  async closeBrowser() {
    await this.browser.close();
  }
}

exports.default = WayBackShot;
