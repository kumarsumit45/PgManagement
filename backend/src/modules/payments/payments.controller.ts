import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  GenerateInvoiceDto,
  CreateRazorpayOrderDto,
  VerifyPaymentDto,
  RecordCashPaymentDto,
} from './dto/payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('invoices/generate')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Generate monthly rent invoice for a tenant' })
  generateInvoice(@Body() dto: GenerateInvoiceDto) {
    return this.paymentsService.generateInvoice(dto);
  }

  @Get('invoices/due')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get all overdue / pending invoices' })
  getDueInvoices() {
    return this.paymentsService.getDueInvoices();
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details' })
  getInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.getInvoiceById(id);
  }

  @Get('my-invoices')
  @UseGuards(RolesGuard)
  @Roles(Role.TENANT)
  @ApiOperation({ summary: 'Get own invoices (Tenant)' })
  myInvoices(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.paymentsService.getTenantInvoices(user.id, pagination);
  }

  @Post('razorpay/create-order')
  @ApiOperation({ summary: 'Create Razorpay payment order' })
  createOrder(@Body() dto: CreateRazorpayOrderDto) {
    return this.paymentsService.createRazorpayOrder(dto);
  }

  @Post('razorpay/verify')
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Public()
  @Post('razorpay/webhook')
  @ApiOperation({ summary: 'Razorpay webhook handler (public)' })
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.body, signature);
  }

  @Post('cash')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CARETAKER)
  @ApiOperation({ summary: 'Record cash payment' })
  recordCash(@Body() dto: RecordCashPaymentDto, @CurrentUser() user: User) {
    return this.paymentsService.recordCashPayment(dto, user.id);
  }

  @Get('reports/revenue')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Monthly revenue report' })
  @ApiQuery({ name: 'month', required: false, example: '2026-06' })
  revenueReport(@Query('month') month?: string) {
    return this.paymentsService.getRevenueReport(month);
  }
}
