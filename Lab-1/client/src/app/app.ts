import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from './core/services/socket.service';
import { JoinRoomComponent } from './components/join-room/join-room.component';
import { ChatRoomComponent } from './components/chat-room/chat-room.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, JoinRoomComponent, ChatRoomComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly socketService = inject(SocketService);
  public readonly isJoined = this.socketService.isJoined;
}
