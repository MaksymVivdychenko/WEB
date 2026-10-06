import {
  Component,
  inject,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.css',
})
export class ChatRoomComponent implements AfterViewChecked {
  private readonly socketService = inject(SocketService);

  @ViewChild('messagesContainer') private readonly messagesContainer!: ElementRef;
  @ViewChild('msgInput') private readonly msgInput!: ElementRef;

  public readonly currentRoom = this.socketService.currentRoom;
  public readonly currentUser = this.socketService.currentUser;
  public readonly roomUsers = this.socketService.roomUsers;
  public readonly messages = this.socketService.messages;

  public messageText = '';
  private shouldScroll = false;

  onSendMessage() {
    if (!this.messageText.trim()) return;
    this.socketService.sendMessage(this.messageText);
    this.messageText = '';
    this.shouldScroll = true;
    if (this.msgInput?.nativeElement) {
      this.msgInput.nativeElement.focus();
    }
  }

  onLeave() {
    this.socketService.leaveRoom();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.messagesContainer) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }
}
