import { IsString, IsOptional, IsUUID } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  question!: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
