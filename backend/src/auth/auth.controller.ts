import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { PinDto } from './dto/pin.dto';
import {
  AdminAuthResponseDto,
  PinAuthResponseDto,
} from './dto/auth-response.dto';
import { RateLimit, RateLimitGuard } from '@common/guards/rate-limit.guard';

@ApiTags('auth')
@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('admin')
  @RateLimit(20, 60)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'verifyAdmin' })
  @ApiResponse({ status: 200, type: AdminAuthResponseDto })
  verifyAdmin(@Body() dto: AdminLoginDto) {
    return this.auth.verifyAdmin(dto.passphrase);
  }

  @Post('pin')
  @RateLimit(180, 60)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'verifyPin' })
  @ApiResponse({ status: 200, type: PinAuthResponseDto })
  verifyPin(@Body() dto: PinDto) {
    return this.auth.verifyPin(dto.pin);
  }
}
