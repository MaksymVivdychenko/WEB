import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import { defaultStudentConfig } from '../config/student.config';
import { TimeUtils } from '../common/time.util';
import { IdUtils } from '../common/id.util';


const intervalSeconds = 10 + (defaultStudentConfig.variant || 1); // 10 + 9 = 19 seconds
const intervalMs = intervalSeconds * 1000;
const autoBroadcastBaseText = `Автоматичне повідомлення від ст. ${defaultStudentConfig.studentName} гр. ${defaultStudentConfig.group} Варіант ${defaultStudentConfig.variant}`;

@Injectable()
export class AutoBroadcastService {
  private readonly logger = new Logger(AutoBroadcastService.name);
  private ioServer: Server | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(private readonly chatService: ChatService) { }

  setServer(server: Server) {
    this.ioServer = server;
    this.startBroadcasting();
  }

  private startBroadcasting() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    if (!this.ioServer) {
      return;
    }

    this.logger.log(
      `Auto broadcast scheduled every ${intervalSeconds} seconds ("${autoBroadcastBaseText}")`,
    );

    this.intervalTimer = setInterval(() => {
      this.sendAutoMessage();
    }, intervalMs);
  }

  private sendAutoMessage() {
    if (!this.ioServer) return;

    const rooms = this.chatService.getAllActiveRooms();
    if (rooms.length === 0) {
      return;
    }

    const timeStr = TimeUtils.formatTime();
    const text = `${autoBroadcastBaseText} ${timeStr}`;

    const autoMessage = {
      id: IdUtils.generateId('auto'),
      sender: 'Автоматичне сповіщення',
      text,
      time: timeStr,
      type: 'auto' as const,
    };

    for (const room of rooms) {
      this.ioServer.to(room).emit('new_message', autoMessage);
    }
  }

  stopBroadcasting() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
}
