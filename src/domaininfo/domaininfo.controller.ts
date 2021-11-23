import {
    Controller,
    Get,
    Param,
    Post,
    Delete,
    Patch,
    Body,
    Req,
    Res,
    Query,
  } from '@nestjs/common';
import { DomainInfoService } from './domaininfo.service';
import { DomainInfo } from '@prisma/client';
import WayBackShot from '../tools/WayBackShot/index';
//const WayBackShot = require('../tools/WayBackShot');

const SemTraffic = require("../tools/SemTraffic")

  
  
  @Controller('domaininfo')
  export class DomainInfoController {
    constructor(private readonly domainInfoService: DomainInfoService) {}
  
    // @Get()
    // getAll(): DomainInfo[] {
    //   return this.domainInfoService.domainInfo();
    // }
  
    @Get('filtered-domaininfos')
    async getOnePageDomainInfos(
      @Query('skip') skip: number,
      @Query('take') take: number,
      @Query('orderBy') orderById: 'asc' | 'desc',
      @Query('searchString') searchString: string
    ): Promise<{domainInfos: DomainInfo[], count: number}> {

      return  Promise.all([
        this.domainInfoService.domainInfos({
          skip: skip*1,
          take: take*1,
          orderBy: {
              id: orderById || "desc"
          },
          // where: {
          //     name: {contains: searchString || ""}
          // //   OR: [
          // //     {
          // //       title: { contains: searchString },
          // //     },
          // //     {
          // //       content: { contains: searchString },
          // //     },
          // //   ],
            
          // },
          
        }),
        this.domainInfoService.domainInfoCount({where: null})
        
      ])
      .then((values)=>{
        return {
          domainInfos: values[0],
          count: values[1]
        }

      })
      .catch((err)=>{
        console.log(err)
        return {
          domainInfos: null,
          count: null
        }
      })
      
      
        
      
    }
    @Get('getAllCount')
    async getAllCount(): Promise<number>{
     return this.domainInfoService.domainInfoCount(null)
    }
    @Get(':id')
    async getDomainInfoById(@Param('id') domainInfoId: string): Promise<DomainInfo> {

      return this.domainInfoService.domainInfo({id: parseInt(domainInfoId)});
    }
    

    @Post('change-mypoint')
    async ChangeMyPoint(
      @Body() postData: {domainName: string}
    ): Promise<DomainInfo>{
      const {domainName} = postData;
      return this.domainInfoService.updateDomainInfo({where: {name: domainName}, data: {myPoint: 0} })
    }

    @Post('update-domain')
    async UpdateDomain(
      @Body() postData: {id: number, field: string, value:any }
    ): Promise<DomainInfo>{

      const {id, field, value} = postData;

     
        if(id && field && (value !== null && value !== undefined)){
          let changeData = {}
          changeData[field] = value;
          return this.domainInfoService.updateDomainInfo({where: {id: id}, data: changeData});
  
        }else return null;

     

    }

    @Post('get-domain-infos-by-names')
    async GetDomainInfos(
      @Body() postData: { domainNames: string[];}
    ): Promise<DomainInfo[]>{
      const {domainNames} = postData;
      return this.domainInfoService.domainInfosIn({domainNames: domainNames})

    }



  @Post('waybackshots')
  async makeWayBackShots(@Body() postData: { domainNames: string[]}): Promise<Object>{
  
    const {domainNames} = postData;  
    let domainInfos = await this.domainInfoService.domainInfosIn({domainNames: domainNames})
    let shotPaths = {};
    let wayBackShot = new WayBackShot();
    await wayBackShot.initBrowser();
    for(let domainInfo of domainInfos){
      try{
        console.log("domain info = ", domainInfo)
        shotPaths[domainInfo.name] = null;
        let shotResult = await wayBackShot.shotWithInfo(domainInfo);
        if(shotResult){
          await this.domainInfoService.updateDomainInfo({where: {id: domainInfo.id}, data: {
            shotPath: shotResult.path || null
          }})
          shotPaths[domainInfo.name] = shotResult.path
        }

      }catch(loopErr){
        console.log("loop Err = ", loopErr)
      }
      

    }
    //await wayBackShot.closeBrowser();
    return {paths: shotPaths};
  }

  @Post('waybackshot')
  async makeWayBackShotWithName(@Body() postData: { domainNames: string[]}): Promise<Object>{
  
    const {domainNames} = postData;  
    //let domainInfos = await this.domainInfoService.domainInfosIn({domainNames: domainNames})
    let shotPaths = {};
    let wayBackShot = new WayBackShot();
    await wayBackShot.initBrowser();
    for(let domainName of domainNames){
      try{
        console.log("domainName  = ", domainName)
        shotPaths[domainName] = null;
        let shotResult = await wayBackShot.shotWithName(domainName);
        if(shotResult){
          // await this.domainInfoService.updateDomainInfo({where: {id: domainInfo.id}, data: {
          //   shotPath: shotResult.path || null
          // }})
          shotPaths[domainName] = shotResult.path
        }

      }catch(loopErr){
        console.log("loop Err = ", loopErr)
      }
      

    }
    //await wayBackShot.closeBrowser();
    return {paths: shotPaths};
  }

  @Post('checkdomains')
  async CheckDomains( @Body() postData: { domainNames: string[], expireStrObj: Object;}): Promise<Object>{

    try{
      
      let retDomainInfos = {};
      let notFoundDomains = [];
      let checkExistDomains = [];
      const {domainNames, expireStrObj} = postData;
      console.log("post Data = ", postData)
      for(let domainName of domainNames){
        let domainInfo = await this.domainInfoService.domainInfo({name: domainName});
        if(domainInfo){
          //어떤 오류로 못가져왔을때는 다시시도
          if(domainInfo.myPoint !== undefined && domainInfo.myPoint === -1){
            notFoundDomains.push(domainName)
            checkExistDomains.push(domainName)
          }else{
            retDomainInfos[domainName] = domainInfo;
          }

         
          
        }else{
          notFoundDomains.push(domainName)
        }

      }
      //console.log("getraffic = ", SemTraffic)

      let notFoundTraffics = await SemTraffic.semTraffic(notFoundDomains);
      //console.log("not found traffics = ", notFoundTraffics);
      for(let key of Object.keys(notFoundTraffics)){

        try{
          let traffic = notFoundTraffics[key];
          if(traffic["yearMonth"]){
            if(checkExistDomains.includes(key)){
              // db에 도메인 정보 있짐만 트래픽은 없는경우 업데이트로
              console.log("orga = ", traffic["Organic Traffic"])
              let maxTraffic =  0;
              let maxTrafficIndex = null;
             
              for(let i =0; i<traffic["Organic Traffic"].length; i++){
                if((traffic["Organic Traffic"][i].replace(/,/g, "") * 1) > maxTraffic)
                  maxTraffic = traffic["Organic Traffic"][i].replace(/,/g, "") * 1
              }
              console.log("max traffic = ", maxTraffic)
              //let expireDate = this.domainInfoService.makeExpiringDate(expireStrObj[key])
              let updateResult = await this.domainInfoService.updateDomainInfo({
                where: {name: key},
                data:{
                  yearMonth: JSON.stringify(traffic["yearMonth"]),
                  organicTraffic: JSON.stringify(traffic["Organic Traffic"]),
                  paidTraffic: JSON.stringify(traffic["Paid Traffic"]),
                  topKeyword: JSON.stringify(traffic["Top 3"]),
                  fourKerword: JSON.stringify(traffic["4-10"]),
                  elevenKeyWord: JSON.stringify(traffic["11-20"]),
                  twentyOneKeyword: JSON.stringify(traffic["21-50"]),
                  fiftyOneKeyword: JSON.stringify(traffic["51-100"]),
                  totalKeyword: JSON.stringify(traffic["Total"]),
                  maxTraffic: maxTraffic? maxTraffic  : null,
                  myPoint: maxTraffic > 100? 1 : 0,
                  endAt: expireStrObj && expireStrObj[key] ? this.domainInfoService.makeExpiringDate(expireStrObj[key]) : null,
                  maxYearMonth: traffic["yearMonth"] && traffic["yearMonth"][maxTrafficIndex]? this.makeMaxYearMonthStr(traffic["yearMonth"][maxTrafficIndex]) : null

                }
              
              })
              console.log("update Result = ", updateResult);
              retDomainInfos[key] = updateResult;

            }else{
              console.log("orga = ", traffic["Organic Traffic"])
              let maxTraffic =  0;
              let maxTrafficIndex = null;
              
              for(let i =0; i<traffic["Organic Traffic"].length; i++){
                //console.log("orga= ", i, traffic["Organic Traffic"][i])
                if((traffic["Organic Traffic"][i].replace(/,/g, "") * 1) > maxTraffic){
                  maxTraffic = traffic["Organic Traffic"][i].replace(/,/g, "") * 1;
                  maxTrafficIndex = i;
                }
                 
              }
              console.log("max traffic = ", maxTraffic)
             
              let createResult = await this.domainInfoService.createDomainInfo({
                name: key,
                yearMonth: JSON.stringify(traffic["yearMonth"]),
                organicTraffic: JSON.stringify(traffic["Organic Traffic"]),
                paidTraffic: JSON.stringify(traffic["Paid Traffic"]),
                topKeyword: JSON.stringify(traffic["Top 3"]),
                fourKerword: JSON.stringify(traffic["4-10"]),
                elevenKeyWord: JSON.stringify(traffic["11-20"]),
                twentyOneKeyword: JSON.stringify(traffic["21-50"]),
                fiftyOneKeyword: JSON.stringify(traffic["51-100"]),
                totalKeyword: JSON.stringify(traffic["Total"]),
                maxTraffic: maxTraffic? maxTraffic  : null,
                myPoint: maxTraffic > 100? 1 : 0,
                endAt: expireStrObj && expireStrObj[key] ? this.domainInfoService.makeExpiringDate(expireStrObj[key]) : null,
                maxYearMonth: traffic["yearMonth"] && traffic["yearMonth"][maxTrafficIndex]? this.makeMaxYearMonthStr(traffic["yearMonth"][maxTrafficIndex]) : null
              })
              console.log("create Result = ", createResult);
              retDomainInfos[key] = createResult;

            }
           
  
          }else{
            let createResult = await this.domainInfoService.createDomainInfo({
              name: key,
              myPoint: 0
            })
            console.log("create Result = ", createResult);
            retDomainInfos[key] = createResult;
  
          }

        }catch(createError){
          console.log("loop createError", createError)
          // let createResult = await this.domainInfoService.createDomainInfo({
          //   name: key,
          //   myPoint: -1
          // })
          //console.log("create Result = ", createResult);
          //retDomainInfos[key] = createResult;


        }

      
      } // for loop 
      //return retDomainInfos;
      return {
        ok: true,
        data: retDomainInfos,
        error: null
      } 

    }catch(err){
      console.log("check domain error = ", err);
      return {
        ok: true,
        data: null,
        error: err
      } 
    }
  }


  @Post('insertdomains')
  async InsertDomains( @Body() postData: { domainNames: string[], expireStrObj: Object;}): Promise<Object>{

    try{
      
      let retDomainInfos = {};
      let notFoundDomains = [];
      let checkExistDomains = [];
      const {domainNames, expireStrObj} = postData;
      console.log("post Data = ", postData)
      for(let domainName of domainNames){
        let domainInfo = await this.domainInfoService.domainInfo({name: domainName});
        if(domainInfo){
          //어떤 오류로 못가져왔을때는 다시시도
          // name, endat, 
          if(domainInfo.myPoint !== undefined && domainInfo.myPoint === -1){
            notFoundDomains.push(domainName)
            checkExistDomains.push(domainName)
          }else{
            retDomainInfos[domainName] = domainInfo;
          }

         
          
        }else{
          notFoundDomains.push(domainName)
        }

      }
      //console.log("getraffic = ", SemTraffic)
      let createResult = await this.domainInfoService.createDomainInfos(notFoundDomains.map((v)=>{
        return {
          name: v
        }
      }))
      console.log("create Result = ", createResult);


      
      return {
        ok: true,
        data: retDomainInfos,
        error: null
      } 

    }catch(err){
      console.log("check domain error = ", err);
      return {
        ok: true,
        data: null,
        error: err
      } 
    }
  }

  makeMaxYearMonthStr(monthYearStr): string{
    try{
      console.log("make max year month str = ", monthYearStr)
      let splitArr = monthYearStr.split('.')
      if(monthYearStr && splitArr.length > 1){
        let month = splitArr[1] * 1;
        if(month / 10 >= 1){
          return splitArr[0] + splitArr[1];
        }else{
          return splitArr[0] + '0' + splitArr[1];
        }
        

      }else{
        return null;
      }

    }catch(err){
      console.log(err);
      return null;
    }
  }
  
  @Post('new')
  async CreateDomainInfo(
    @Body() postData: { domainName: string;  yearMonth: string[];
        organicTraffic: number[];
        paidTraffic: number[];
        topKeyword: number[];
        fourKerword: number[];
        elevenKeyWord: number[];
        twentyOneKeyword: number[];
        fiftyOneKeyword: number[];
        totalKeyword: number[];
        myPoint: number
           },
  ): Promise<DomainInfo> {
    const { domainName, yearMonth, organicTraffic, paidTraffic, topKeyword, fourKerword, elevenKeyWord, twentyOneKeyword, fiftyOneKeyword, totalKeyword, myPoint} = postData;
    console.log(postData)
    let yearMonthStr = yearMonth? JSON.stringify(yearMonth) : "";
    let organicTrafficStr = organicTraffic? JSON.stringify(organicTraffic) : "";
    let paidTrafficStr = paidTraffic? JSON.stringify(paidTraffic) : "";
    let topKeywordStr = topKeyword? JSON.stringify(topKeyword) : "";
    let fourKerwordStr = fourKerword? JSON.stringify(fourKerword) : "";
    let elevenKeyWordStr = elevenKeyWord? JSON.stringify(elevenKeyWord) : "";
    let twentyOneKeywordStr = twentyOneKeyword? JSON.stringify(twentyOneKeyword) : "";
    let fiftyOneKeywordStr = fiftyOneKeyword? JSON.stringify(fiftyOneKeyword) : "";
    let totalKeywordStr = totalKeyword? JSON.stringify(totalKeyword) : "";
    let myPointToInserted = myPoint > -1 ? myPoint : null; 

    return this.domainInfoService.createDomainInfo({
        name: domainName,
        yearMonth : yearMonthStr,
        organicTraffic: organicTrafficStr,
        paidTraffic: paidTrafficStr,
        topKeyword: topKeywordStr,
        fourKerword: fourKerwordStr,
        elevenKeyWord: elevenKeyWordStr,
        twentyOneKeyword: twentyOneKeywordStr,
        fiftyOneKeyword: fiftyOneKeywordStr,
        totalKeyword: totalKeywordStr,
        myPoint: myPointToInserted
   
    });
  }
  
    
  }
  