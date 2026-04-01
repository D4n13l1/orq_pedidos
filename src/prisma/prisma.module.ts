import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AppConfigModule } from 'src/app-config/app-config.module';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
