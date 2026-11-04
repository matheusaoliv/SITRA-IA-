import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto) {
    try {
      return await this.prisma.organization.create({ data: { name: dto.name.trim(), code: dto.code?.toUpperCase() } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um órgão cadastrado com este código.');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, createdAt: true },
    });
  }
}
