import { Injectable } from '@nestjs/common';

export interface ChatUser {
  socketId: string;
  username: string;
  room: string;
}

@Injectable()
export class ChatService {
  private readonly users = new Map<string, ChatUser>();

  addUser(socketId: string, username: string, room: string): ChatUser {
    const user: ChatUser = { socketId, username, room };
    this.users.set(socketId, user);
    return user;
  }

  getUser(socketId: string): ChatUser | undefined {
    return this.users.get(socketId);
  }

  removeUser(socketId: string): ChatUser | undefined {
    const user = this.users.get(socketId);
    if (user) {
      this.users.delete(socketId);
    }
    return user;
  }

  getUsersInRoom(room: string): string[] {
    const userList: string[] = [];
    for (const user of this.users.values()) {
      if (user.room === room && !userList.includes(user.username)) {
        userList.push(user.username);
      }
    }
    return userList;
  }

  getAllActiveRooms(): string[] {
    const rooms = new Set<string>();
    for (const user of this.users.values()) {
      if (user.room) {
        rooms.add(user.room);
      }
    }
    return Array.from(rooms);
  }
}
