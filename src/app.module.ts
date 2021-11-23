import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {PostService} from './post.service';
import {UserService} from './user.service';
import { PrismaService } from './prisma.service';
import { DomainInfoModule } from './domaininfo/domaininfo.module';
import { Service } from './.service';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import {join} from 'path';


@Module({
  imports: [DomainInfoModule,
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'public'),
    // })
  ],
  controllers: [AppController],
  providers: [AppService, PostService, UserService,PrismaService, Service],
})
export class AppModule {}
