import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { TestQueueProducer } from './queue/test-queue.producer';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly testQueueProducer: TestQueueProducer,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-queue/trigger')
  async triggerTestJob() {
    return this.testQueueProducer.addGreetingJob('World');
  }
}
