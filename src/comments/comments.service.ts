import { Injectable } from '@nestjs/common';
import { Comments } from './entities/comments.entity';
import { ResponseCommentDto } from './dto/response-comment.dto';
import { PagingDto } from 'src/paging.dto';
import { CommentsRepository } from './comments.repository';
import { Member } from '../member/entities/member.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  // 전체 댓글과 답글을 가져오는 메서드
  async findAll(
    page: number,
    size: number = 5,
  ): Promise<PagingDto<ResponseCommentDto[]>> {
    const parentComments: Comments[] =
      await this.commentsRepository.getCommentsByParentId(0, page, size);
    const totalPages: number = await this.commentsRepository.count();

    // 각 부모 댓글에 대한 답글도 함께 가져옴
    const allComments: ResponseCommentDto[][] = await Promise.all(
      parentComments.map(this.getCommentWithReplies.bind(this)),
    );

    return {
      data: allComments.flat(),
      totalPages,
    };
  }

  private async getCommentWithReplies(
    comment: Comments,
  ): Promise<ResponseCommentDto[]> {
    const replies: Comments[] =
      await this.commentsRepository.getCommentsByParentId(Number(comment.id));
    const commentDto: ResponseCommentDto =
      ResponseCommentDto.createResponseDto(comment);
    const replyDtos: ResponseCommentDto[] = replies.map(
      ResponseCommentDto.createResponseDto,
    );
    return [commentDto, ...replyDtos];
  }

  async create(
    createCommentDto: CreateCommentDto,
    member: Member,
  ): Promise<void> {
    const comment: Comments = this.commentsRepository.create({
      body: createCommentDto.body,
      member: member,
      parentId: String(createCommentDto.parentId),
    });
    await this.commentsRepository.save(comment);
  }

  async update(
    updateCommentDto: UpdateCommentDto,
    member: Member,
  ): Promise<void> {
    const comment = await this.findCommentAndCheckPermission(
      updateCommentDto.id,
      member,
    );
    comment.body = updateCommentDto.body;
    await this.commentsRepository.save(comment);
  }

  async delete(id: number, member: Member): Promise<void> {
    const comment = await this.findCommentAndCheckPermission(id, member);
    await this.commentsRepository.remove(comment);
  }

  private async findCommentAndCheckPermission(
    id: number,
    member: Member,
  ): Promise<Comments> {
    const comment: Comments | null = await this.commentsRepository.findOne({
      where: { id:id.toString() },
      relations: ['Member'],
    });

    if (!comment) {
      throw new Error('데이터를 찾을 수 없습니다.');
    }

    if (comment.member.id !== member.id) {
      throw new Error('권한이 없습니다.');
    }

    return comment;
  }
}
