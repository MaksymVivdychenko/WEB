import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  // Reactive state signals
  public readonly isConnected = signal<boolean>(false);
  public readonly isJoined = signal<boolean>(false);
  public readonly currentUser = signal<string>('');
  public readonly currentRoom = signal<string>('');
  public readonly roomUsers = signal<string[]>([]);
  public readonly messages = signal<ChatMessage[]>([]);

  constructor() {
    const serverUrl =
      typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : 'http://localhost:3000';

    this.socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    this.registerSocketEvents();

  }

  private registerSocketEvents() {
    this.socket.on('connect', () => {
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
    });

    this.socket.on('joined_room', (data: { username: string; room: string }) => {
      this.currentUser.set(data.username);
      this.currentRoom.set(data.room);
      this.isJoined.set(true);
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      this.messages.update((prev) => [...prev, message]);
    });

    this.socket.on('room_users', (data: { room: string; users: string[] }) => {
      if (data.room === this.currentRoom()) {
        this.roomUsers.set(data.users);
      }
    });

    this.socket.on('left_room', () => {
      this.isJoined.set(false);
      this.currentUser.set('');
      this.currentRoom.set('');
      this.roomUsers.set([]);
      this.messages.set([]);
    });
  }

  public joinRoom(username: string, room: string) {
    if (!username.trim() || !room.trim()) return;
    this.messages.set([]);
    this.socket.emit('join', {
      username: username.trim(),
      room: room.trim(),
    });
  }

  public sendMessage(text: string) {
    if (!text.trim()) return;
    this.socket.emit('message', { text: text.trim() });
  }

  public leaveRoom() {
    this.socket.emit('leave');
    this.isJoined.set(false);
    this.currentUser.set('');
    this.currentRoom.set('');
    this.roomUsers.set([]);
    this.messages.set([]);
  }
}

