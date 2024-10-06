import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { ResponseCommentDto } from './dto/response-comment.dto';
import { PagingDto } from 'src/paging.dto';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetMember } from 'src/member/get-Member.decorator';
import { Member } from 'src/member/entities/member.entity';
import { AuthGuard } from '@nestjs/passport';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
@ApiTags('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: '방명록 데이터 불러오기(페이징)' })
  @ApiExtraModels(PagingDto, ResponseCommentDto)
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(PagingDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ResponseCommentDto) },
            },
          },
        },
      ],
    },
  })
  findAll(
    @Query('page') page: number = 1,
  ): Promise<PagingDto<ResponseCommentDto[]>> {
    return this.commentsService.findAll(page);
  }

  @Post()
  @ApiOperation({ summary: '방명록 저장' })
  @UseGuards(AuthGuard('jwt'))
  create(
    @GetMember() member: Member,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<void> {
    return this.commentsService.create(createCommentDto, member);
  }

  @Patch()
  @ApiOperation({ summary: '방명록 수정' })
  @UseGuards(AuthGuard('jwt'))
  update(
    @GetMember() member: Member,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<void> {
    return this.commentsService.update(updateCommentDto, member);
  }

  @Delete('/:id')
  @ApiOperation({ summary: '방명록 삭제' })
  @UseGuards(AuthGuard('jwt'))
  delete(@GetMember() member: Member, @Param('id') id: string): Promise<void> {
    return this.commentsService.delete(id, member);
  }
}
