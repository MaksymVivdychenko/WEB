import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-room.component.html',
  styleUrl: './join-room.component.css',
})
export class JoinRoomComponent {
  private readonly socketService = inject(SocketService);

  public username = 'user1';
  public room = 'room1';

  onJoin() {
    this.socketService.joinRoom(this.username, this.room);
  }
}
