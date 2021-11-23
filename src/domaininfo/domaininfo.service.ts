import { Injectable, NotFoundException } from '@nestjs/common';
// import { Movie } from './entities/movie.entity';
// import { CreateMovieDto } from './dto/create-movie.dto';
// import { UpdateMovieDto } from './dto/update-movie.dto';
import { PrismaService } from '../prisma.service';
import {
//   DomainInfoUpdateInput,
   DomainInfo,
//   DomainInfoCreateInput,
//  // DomainInfoCreateArgs
//   DomainInfoWhereUniqueInput,
//   DomainInfoWhereInput,
//   DomainInfoOrderByInput,
  Prisma,
} from '@prisma/client';

import { Domain } from 'domain';



@Injectable()
export class DomainInfoService {
  constructor(private prisma: PrismaService) {}


  async domainInfosIn(params: {
    domainNames: string[]
  }){
    const {domainNames} = params;
    console.log("domainInfosIn domain names = ", domainNames)
    let orArray = []
    domainNames.forEach((v,i)=>{
      orArray.push({name: v})
    })
    return this.prisma.domainInfo.findMany({
      where: {
        OR: orArray
      }
    });
    
  }
  

  async domainInfos(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.DomainInfoWhereUniqueInput;
    where?: Prisma.DomainInfoWhereInput;
    orderBy?: Prisma.DomainInfoOrderByInput;
  }): Promise<DomainInfo[]> {
    const { skip, take, cursor, where, orderBy } = params;
    console.log("in domaininfos ", skip, take, cursor, where, orderBy)
    return this.prisma.domainInfo.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

    async domainInfo(domainInfoWhereUniqueInput: Prisma.DomainInfoWhereUniqueInput): Promise<DomainInfo | null> {
        return this.prisma.domainInfo.findUnique({
          where: domainInfoWhereUniqueInput,
        });
    }

    async domainInfoCount(params:{where?: Prisma.DomainInfoWhereInput;}): Promise<number>{
      const {where} = params;
      if(where){
        return this.prisma.domainInfo.count({where})
      }else{
        return this.prisma.domainInfo.count();
      }
      

    }



  async createDomainInfo(domainInfoData: Prisma.DomainInfoCreateInput): Promise<DomainInfo> {
    return this.prisma.domainInfo.create({
        data: domainInfoData,
      });
  }

  async createDomainInfos(domaInfoDatas: Prisma.DomainInfoCreateInput[]): Promise<any> {
    return this.prisma.domainInfo.createMany({
      data: domaInfoDatas
    })

  }


//   update(id: number, updateData: UpdateMovieDto) {
//     const movie = this.getOne(id);
//     this.deleteOne(id);
//     this.movies.push({ ...movie, ...updateData });
//   }
  async updateDomainInfo(params: {
    where: Prisma.DomainInfoWhereUniqueInput;
    data: Prisma.DomainInfoUpdateInput;
  }): Promise<DomainInfo> {
    const { data, where } = params;
    return this.prisma.domainInfo.update({
      data,
      where,
    });
  }

  async deleteDomainInfo(where: Prisma.DomainInfoWhereUniqueInput): Promise<DomainInfo> {
    return this.prisma.domainInfo.delete({
      where,
    });
  }

  makeExpiringDate(dateStr: string): Date{
    let now = new Date();
    let dateStrs = dateStr.split(' ');
    let addedSeconds: any = 0;
    if(dateStrs.length > 0){
      dateStrs.forEach((v)=>{
        let lastString = v.slice(-1);

        if(lastString == "D"){
          addedSeconds += parseInt(v.match(/\d+/)[0]) * 60 * 60 * 24 

        }else if(lastString == "H"){
          addedSeconds += parseInt(v.match(/\d+/)[0]) * 60 * 60
          
        }else if(lastString == "M"){
          addedSeconds += parseInt(v.match(/\d+/)[0]) * 60 
          
        }else if(lastString == "S"){
          addedSeconds += parseInt(v.match(/\d+/)[0])
        }
      })

    }else{
      return null;
    }
;
    now.setSeconds(now.getSeconds() + addedSeconds)
    return now;

  }

}


