import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { AuthUser, WsVehicleUpdate } from '@trackflow/shared-types';
import { UserRole } from '@trackflow/shared-types';

@WebSocketGateway({ cors: { origin: '*' } })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    const raw: string = client.handshake.auth?.token ?? client.handshake.query?.token ?? '';
    const token = typeof raw === 'string' ? raw.replace('Bearer ', '') : '';

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<AuthUser>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      if (payload.role === UserRole.SUPER_ADMIN) {
        void client.join('fleet:all');
      } else {
        void client.join(`fleet:${payload.companyId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket): void {}

  emitUpdate(update: WsVehicleUpdate): void {
    this.server.to('fleet:all').emit('vehicle:update', update);
    this.server.to(`fleet:${update.companyId}`).emit('vehicle:update', update);
  }
}
