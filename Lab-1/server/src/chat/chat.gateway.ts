import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService, ChatUser } from './chat.service';
import { AutoBroadcastService } from './auto-broadcast.service';
import { TimeUtils } from '../common/time.util';
import { IdUtils } from '../common/id.util';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly autoBroadcastService: AutoBroadcastService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Socket.IO Chat Gateway initialized');
    this.autoBroadcastService.setServer(server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const user = this.chatService.removeUser(client.id);
    if (user) {
      this.handleUserDeparture(client, user);
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { username: string; room: string },
  ) {
    const username = data?.username?.trim();
    const room = data?.room?.trim();
    if (!username || !room) {
      return { error: 'Username and Room are required' };
    }

    client.join(room);
    this.chatService.addUser(client.id, username, room);

    // Confirm join to client
    client.emit('joined_room', { username, room });

    // Welcome message to joining user
    this.sendAdminMessage(client, `Welcome, ${username}!`);

    // Notify other users in room
    this.broadcastAdminMessageToRoom(room, `${username} has joined!`, client);

    // Send updated user list to everyone in room
    this.broadcastRoomUsers(room);

    return { status: 'ok' };
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { text: string },
  ) {
    const user = this.chatService.getUser(client.id);
    const text = data?.text?.trim();
    if (!user || !text) {
      return;
    }

    const message = {
      id: IdUtils.generateId('msg'),
      sender: user.username,
      text,
      time: TimeUtils.formatTime(),
      type: 'user' as const,
    };

    this.server.to(user.room).emit('new_message', message);
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket) {
    const user = this.chatService.removeUser(client.id);
    if (user) {
      client.leave(user.room);
      this.handleUserDeparture(client, user);
      client.emit('left_room');
    }
  }

  // --- Helper Methods (DRY) ---

  private createAdminMessage(text: string) {
    return {
      id: IdUtils.generateId('admin'),
      sender: 'Admin',
      text,
      time: TimeUtils.formatTime(),
      type: 'admin' as const,
    };
  }

  private sendAdminMessage(target: Socket, text: string) {
    target.emit('new_message', this.createAdminMessage(text));
  }

  private broadcastAdminMessageToRoom(
    room: string,
    text: string,
    excludeSocket?: Socket,
  ) {
    const message = this.createAdminMessage(text);
    if (excludeSocket) {
      excludeSocket.to(room).emit('new_message', message);
    } else {
      this.server.to(room).emit('new_message', message);
    }
  }

  private broadcastRoomUsers(room: string) {
    this.server.to(room).emit('room_users', {
      room,
      users: this.chatService.getUsersInRoom(room),
    });
  }

  private handleUserDeparture(socket: Socket, user: ChatUser) {
    this.broadcastAdminMessageToRoom(user.room, `${user.username} has left!`, socket);
    this.broadcastRoomUsers(user.room);
  }
}
