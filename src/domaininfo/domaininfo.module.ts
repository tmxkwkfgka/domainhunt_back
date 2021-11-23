import { Module } from '@nestjs/common';
import { DomainInfoController } from './domaininfo.controller';
import { DomainInfoService } from './domaininfo.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DomainInfoController],
  providers: [DomainInfoService, PrismaService],
  //exports: [DomainInfoService]
})
export class DomainInfoModule {}
