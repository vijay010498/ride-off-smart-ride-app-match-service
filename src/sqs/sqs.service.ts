import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { MyConfigService } from '../my-config/my-config.service';
import {
  SQSClient,
  ReceiveMessageCommand,
  Message,
  DeleteMessageBatchCommand,
  DeleteMessageBatchRequestEntry,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { SqsProcessorService } from '../sqs_processor/sqs_processor.service';
import { RiderRideDocument } from '../common/schemas/rider-ride.schema';
import { Events } from '../common/enums/events.enums';

@Injectable()
export class SqsService implements OnModuleInit {
  private readonly SQS: SQSClient;
  private readonly logger = new Logger(SqsService.name);
  constructor(
    @Inject(forwardRef(() => SqsProcessorService))
    private readonly sqsProcessor: SqsProcessorService,
    private readonly configService: MyConfigService,
  ) {
    this.SQS = new SQSClient({
      apiVersion: 'latest',
      region: this.configService.getDefaultAwsRegion(),
      credentials: {
        accessKeyId: this.configService.getAWSSQSAccessID(),
        secretAccessKey: this.configService.getAWSSQSSecretKey(),
      },
    });
  }
  async onModuleInit() {
    this.startPolling();
  }

  private async startPolling() {
    try {
      await this._pollMessages();
    } catch (error) {
      this.logger.error('Error occurred during polling:', error);
      // Handle error (e.g., retry or exit)
    }
  }

  private async _pollMessages() {
    this.logger.log('started-polling');

    // Define the function to execute for polling
    const pollFunction = async () => {
      try {
        const messages: Message[] = await this.receiveMessages(
          this.configService.getSqsQueueURL(),
        );
        if (messages.length > 0) {
          // Process received messages
          try {
            await this.sqsProcessor.ProcessSqsMessage(messages);
            await this._deleteMessages(messages);
          } catch (error) {
            this.logger.error(
              'Error occurred during sqs message processing / deleting:',
              error,
            );
          }
        }
      } catch (error) {
        this.logger.error('Error occurred during polling:', error);
      }
    };

    // Poll immediately and then every 10 seconds
    pollFunction(); // Poll immediately
    setInterval(pollFunction, 10000); // Poll every 10 seconds
  }

  private async receiveMessages(queueUrl: string, maxMessages: number = 10) {
    try {
      const sqsConsumeCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        //his parameter specifies the duration (in seconds) for which the call waits for a message to arrive in the queue before returning. 20 seconds, which means if there are no messages available in the queue, the call will wait up to 20 seconds for messages to arrive before returning an empty response. This helps reduce the number of empty responses and can improve efficiency.
        WaitTimeSeconds: 20,
        // This parameter specifies the duration (in seconds) that the received messages are hidden from subsequent retrieval requests. 5 seconds, which means once a message is received, it will be hidden from other consumers for 5 seconds. This prevents other consumers from processing the same message simultaneously, ensuring that each message is processed by only one consumer.
        VisibilityTimeout: 60,
        MessageAttributeNames: ['All'],
      });
      const { Messages } = await this.SQS.send(sqsConsumeCommand);
      return Messages ? Messages : [];
    } catch (receiveMessagesError) {
      this.logger.error('receiveMessagesError', receiveMessagesError);
      throw receiveMessagesError;
    }
  }

  private async _deleteMessages(messages: Message[]) {
    try {
      const deleteCommands: DeleteMessageBatchRequestEntry[] = messages.map(
        ({ ReceiptHandle }, index) => ({
          Id: `Message${index + 1}`,
          ReceiptHandle,
        }),
      );

      const deleteRequest = {
        QueueUrl: this.configService.getSqsQueueURL(),
        Entries: deleteCommands,
      };

      await this.SQS.send(new DeleteMessageBatchCommand(deleteRequest));
      this.logger.log('Messages deleted from SQS');
    } catch (error) {
      this.logger.error('Error deleting messages from SQS:', error);
      throw error;
    }
  }

  private async _sendMessageToQueue(message: string) {
    try {
      const params = {
        QueueUrl: this.configService.getSqsQueueURL(),
        MessageBody: message,
      };

      await this.SQS.send(new SendMessageCommand(params));
      this.logger.log('Message sent to SQS queue - Success');
    } catch (error) {
      this.logger.error('_sendMessageToQueue-error', error);
      throw error;
    }
  }

  async noDriversFoundEvent(riderRide: RiderRideDocument) {
    return this._sendMessageToQueue(
      JSON.stringify({
        riderRide,
        EVENT_TYPE: Events.newRiderRideCreated,
      }),
    );
  }
}
